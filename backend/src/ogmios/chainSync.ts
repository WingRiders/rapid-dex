import {createChainSynchronizationClient} from '@cardano-ogmios/client'
import type {BlockPraos, Origin, Point, Tip} from '@cardano-ogmios/schema'
import {
  getUtxoId,
  poolDatumFromCbor,
  poolOil,
  poolValidatorHash,
} from '@wingriders/rapid-dex-common'
import BigNumber from 'bignumber.js'
import {
  dbPoolOutputToPool,
  dbPoolOutputToPoolState,
  dbPoolOutputToUtxo,
} from '../db/helpers'
import {
  type Block,
  type PoolOutput,
  type Prisma,
  prisma,
} from '../db/prismaClient'
import {originPoint} from '../helpers'
import {logger} from '../logger'
import {
  emitPoolCreated,
  emitPoolStateUpdated,
  emitPoolUpdatesOnRollback,
  emitPoolUtxoUpdated,
} from '../poolsUpdates'
import {emitTxAddedToBlock} from '../txsListener'
import {isPoolOutput} from './helpers'
import {getOgmiosContext} from './ogmios'
import {ogmiosMetadataToJson} from './ogmiosMetadataToJson'
import {ogmiosValueToMeshAssets} from './ogmiosValueToMeshAssets'
import {parseOgmiosScript} from './parseOgmiosScript'
import {
  addPoolOutputToCache,
  getShareAssetNameByPoolUtxoId,
  initPoolOutputCache,
  poolOutputExists,
  removePoolOutputFromCache,
} from './poolOutputCache'

// Buffering is suitable when doing the initial sync
const BUFFER_SIZE = 10_000

// Aggregation logic is here
const processBlock = async (block: BlockPraos, tip: Tip | Origin) => {
  const isFullySynced = tip !== 'origin' && block.height === tip.height

  blockBuffer.push({
    slot: block.slot,
    hash: block.id,
    height: block.height,
  })

  // For each transaction in the block
  // - Check for any inputs spending tracked PoolOutputs
  // - Handle pool outputs
  block.transactions?.forEach((tx) => {
    emitTxAddedToBlock(tx.id)

    const hasPoolInInputsIfFullySynced =
      isFullySynced &&
      // do this loop only if isFullySynced is true because that's only when we need it
      tx.inputs.some((input) =>
        poolOutputExists(
          getUtxoId({txHash: input.transaction.id, outputIndex: input.index}),
        ),
      )
    tx.outputs.forEach((output, outputIndex) => {
      // Handle pool output
      if (isPoolOutput(output)) {
        // since it's a valid pool output it must have datum
        const datum = output.datum!
        const poolDatum = poolDatumFromCbor(datum)
        const isAdaPool = poolDatum.aAssetName === ''

        const poolUtxoId = getUtxoId({txHash: tx.id, outputIndex})
        addPoolOutputToCache(poolUtxoId, poolDatum.sharesAssetName)
        const script = parseOgmiosScript(output.script)

        const poolOutput: PoolOutput = {
          utxoId: poolUtxoId,
          spendUtxoId: null,
          slot: block.slot,
          spendSlot: null,
          shareAssetName: poolDatum.sharesAssetName,
          assetAPolicy: poolDatum.aPolicyId,
          assetAName: poolDatum.aAssetName,
          assetBPolicy: poolDatum.bPolicyId,
          assetBName: poolDatum.bAssetName,
          lpts: output.value[poolValidatorHash]![poolDatum.sharesAssetName]!,
          qtyA: isAdaPool
            ? BigInt(
                new BigNumber(output.value.ada.lovelace.toString())
                  .minus(poolOil)
                  .toString(),
              )
            : output.value[poolDatum.aPolicyId]![poolDatum.aAssetName]!,
          qtyB: output.value[poolDatum.bPolicyId]![poolDatum.bAssetName]!,
          swapFeePoints: poolDatum.swapFeePoints,
          feeBasis: poolDatum.feeBasis,
          address: output.address,
          assets: ogmiosValueToMeshAssets(output.value),
          coins: output.value.ada.lovelace,
          datumCBOR: datum,
          txMetadata: ogmiosMetadataToJson(tx) ?? null,
          scriptVersion: script?.version ?? null,
          scriptCBOR: script?.cbor ?? null,
        }

        if (isFullySynced) {
          const validAt = new Date()
          if (hasPoolInInputsIfFullySynced) {
            emitPoolStateUpdated({
              shareAssetName: poolDatum.sharesAssetName,
              poolState: dbPoolOutputToPoolState(poolOutput),
              validAt,
            })
            emitPoolUtxoUpdated({
              shareAssetName: poolDatum.sharesAssetName,
              utxo: dbPoolOutputToUtxo(poolOutput),
              validAt,
            })
          } else {
            emitPoolCreated({
              pool: {
                ...dbPoolOutputToPool(poolOutput),
                validAt,
              },
            })
          }
        }

        poolOutputBuffer.push(poolOutput)
      }
    })

    // Mark spent pool outputs
    tx.inputs
      .map((input) =>
        getUtxoId({txHash: input.transaction.id, outputIndex: input.index}),
      )
      .filter(poolOutputExists)
      .forEach((utxoId) => {
        const shareAssetName = getShareAssetNameByPoolUtxoId(utxoId)
        // findLast because the last aggregate pool output is the one that was spent
        const spendUtxoId = poolOutputBuffer.findLast(
          (poolOutput) => poolOutput.shareAssetName === shareAssetName,
        )?.utxoId
        if (spendUtxoId == null) {
          // should never happen because if the pool output was spent
          // a new pool output must be aggregated in the same tx
          const msg = `Spend UTxO not found: utxoId = ${utxoId}, shareAssetName = ${shareAssetName} `
          logger.error({utxoId, shareAssetName}, msg)
          throw new Error(msg)
        }

        removePoolOutputFromCache(utxoId)
        spentPoolOutputBuffer.push({
          utxoId,
          // transaction can have only one pool input and one pool output,
          // so we can safely assume that spendUtxoId in the last element in the poolOutputBuffer
          spendUtxoId,
          spendSlot: block.slot,
        })
      })
  })
}

const processRollback = async (point: 'origin' | Point) => {
  logger.info(point, 'Rollback')
  const rollbackSlot = point === 'origin' ? originPoint.slot : point.slot
  await emitPoolUpdatesOnRollback(rollbackSlot)
  await prisma.$transaction((prismaTx) =>
    prismaTx.block.deleteMany({where: {slot: {gt: rollbackSlot}}}),
  )

  // (Re-)Initialize the cache
  await initPoolOutputCache()
}

// Aggregation framework below
let blockBuffer: Block[] = []
let poolOutputBuffer: PoolOutput[] = []
let spentPoolOutputBuffer: {
  utxoId: string
  spendUtxoId: string
  spendSlot: number
}[] = []

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
      poolOutputs: poolOutputBuffer.length,
      spentPoolOutputs: spentPoolOutputBuffer.length,
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

      prisma.poolOutput.createMany({
        data: poolOutputBuffer as Prisma.PoolOutputCreateManyInput[],
      }),

      spentPoolOutputBuffer.length > 0
        ? prisma.$executeRaw`UPDATE "PoolOutput"
                           SET "spendSlot" = new.spendSlot,
                               "spendUtxoId" = new.spendUtxoId
                           FROM (SELECT *
                                 FROM unnest(
                                         ${spentPoolOutputBuffer.map(({utxoId}) => utxoId)},
                                         ${spentPoolOutputBuffer.map(({spendUtxoId}) => spendUtxoId)},
                                         ${spentPoolOutputBuffer.map(({spendSlot}) => spendSlot)}::integer[]
                                      )) AS new(utxoId, spendUtxoId, spendSlot)
                           WHERE "PoolOutput"."utxoId" = new.utxoId`
        : prisma.$executeRaw`SELECT WHERE false`,
    ])

    logger.info(stats, 'Wrote buffers to DB')

    blockBuffer = []
    poolOutputBuffer = []
    spentPoolOutputBuffer = []
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

  // Initialize the cache
  await initPoolOutputCache()

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

        await processBlock(response.block, response.tip)

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
