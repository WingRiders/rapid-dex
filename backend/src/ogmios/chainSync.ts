import {type Block, prisma} from '@/db/prismaClient'
import {originPoint} from '@/helpers'
import {logger} from '@/logger'
import {createChainSynchronizationClient} from '@cardano-ogmios/client'
import type {BlockPraos, Point} from '@cardano-ogmios/schema'
import {getOgmiosContext} from './ogmios'

// Buffering is suitable when doing the initial sync
const BUFFER_SIZE = 10_000

// Aggregation logic is here
const processBlock = async (block: BlockPraos) => {
  blockBuffer.push({
    slot: block.slot,
    hash: block.id,
    height: block.height,
  })
}

const processRollback = async (point: 'origin' | Point) => {
  logger.info(point, 'Rollback')
  const rollbackSlot = point === 'origin' ? originPoint.slot : point.slot
  await prisma.$transaction((prismaTx) =>
    prismaTx.block.deleteMany({where: {slot: {gt: rollbackSlot}}}),
  )
}

// Aggregation framework below
let blockBuffer: Block[] = []

// Write buffers into DB
const writeBuffersIfNecessary = async ({
  latestLedgerHeight,
  threshold,
  rollbackToSlot,
}: {
  latestLedgerHeight?: number
  threshold: number
  rollbackToSlot?: number
}) => {
  // If one buffer is being written others must as well as they might depend on each other
  // For example block determines in case of restarts the intersect for resuming
  // chain sync. If block buffer was written but other data not, it could get lost forever.
  if (blockBuffer.length >= threshold) {
    const latestBlock = blockBuffer[blockBuffer.length - 1]
    const latestSlot = latestBlock?.slot
    const statsBeforeDbWrite = {
      blocks: blockBuffer.length,
      latestSlot,
      ...(latestLedgerHeight
        ? {progress: (latestBlock?.height || 1) / latestLedgerHeight}
        : {}),
      rollbackToSlot,
    }

    logger.debug(statsBeforeDbWrite, 'Start writing buffers to DB')

    // Stats which will be set in the SQL transaction
    const stats = {
      ...statsBeforeDbWrite,
    }

    // Do the inserts in one transaction to ensure data doesn't get corrupted if the
    // execution fails somewhere
    // Inserting data with unnest ensures that the query is stable and reduces the
    // amount of time it takes to parse the query.
    await prisma.$transaction([
      blockBuffer.length > 0
        ? // Prisma when doing createMany doesn't use unnest, which is slower, so this raw query is more efficient
          prisma.$executeRaw`INSERT INTO "Block" ("slot", "hash", "height")
                           SELECT *
                           FROM unnest(
                                   ${blockBuffer.map(({slot}) => slot)}::integer[],
                                   ${blockBuffer.map(({hash}) => hash)},
                                   ${blockBuffer.map(({height}) => height)}::integer[])`
        : prisma.$executeRaw`SELECT WHERE false`,
    ])

    logger.info(stats, 'Wrote buffers to DB')

    blockBuffer = []
  }
}

// Find starting point for Ogmios, either 10th latest block (to prevent issues in case of
// rollbacks or default to origin
const findIntersect = async () => {
  const dbBlock = await prisma.block.findFirst({
    orderBy: {slot: 'desc'},
    skip: 10,
  })
  return dbBlock ? {id: dbBlock.hash, slot: dbBlock.slot} : originPoint
}

// Start the chain sync client, and add a listener on the underlying socket - connection to Ogmios
// If that closes try to restart the chain sync again
export const startChainSyncClient = async () => {
  // Before starting flush the buffers, required in case of restarts to get rid of stale
  // data and prevent double writes
  blockBuffer = []

  const context = await getOgmiosContext()

  const chainSyncClient = await createChainSynchronizationClient(context, {
    async rollForward(response, nextBlock) {
      // Skip Byron blocks, we are not interested in those addresses
      if (response.block.era !== 'byron') {
        logger.trace(
          {
            slot: response.block.slot,
            height: response.block.height,
            era: response.block.era,
          },
          'Roll forward',
        )

        await processBlock(response.block)

        const latestLedgerHeight =
          response.tip === 'origin' ? originPoint.height : response.tip.height

        // Decide if to use buffering based on proximity to ledger tip
        const threshold =
          response.tip !== 'origin' &&
          response.tip.height - 10 < response.block.height
            ? 1
            : BUFFER_SIZE
        await writeBuffersIfNecessary({latestLedgerHeight, threshold})
      }
      nextBlock()
    },

    async rollBackward(response, nextBlock) {
      logger.trace({point: response.point}, 'Roll backward')
      await writeBuffersIfNecessary({
        threshold: 1,
        rollbackToSlot:
          response.point === 'origin' ? originPoint.slot : response.point.slot,
      })
      await processRollback(response.point)
      nextBlock()
    },
  })

  // Rollback to latest intersect first
  const intersect = await findIntersect()
  await processRollback(intersect)
  logger.info({intersect}, 'Ogmios - resuming chainSyncClient')
  await chainSyncClient.resume([intersect], 100)

  // Restart chainSyncClient on context close
  context.socket.addEventListener('close', () => startChainSyncClient())
}
