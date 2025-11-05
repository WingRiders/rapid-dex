import {createChainSynchronizationClient} from '@cardano-ogmios/client'
import type {BlockPraos, Origin, Point, Tip} from '@cardano-ogmios/schema'
import {deserializeAddress} from '@meshsdk/core'
import {
  bigintToBigNumber,
  bigNumberToBigInt,
  createUnit,
  getUtxoId,
  poolDatumFromCbor,
  poolOil,
  poolValidatorHash,
} from '@wingriders/rapid-dex-common'
import BigNumber from 'bignumber.js'
import {feeFromToDbFeeFrom} from '../db/helpers'
import {
  type Block,
  PoolInteractionType,
  type PoolOutput,
  type Prisma,
  prisma,
} from '../db/prisma-client'
import {poolOutputToInteraction} from '../endpoints/interactions'
import {originPoint} from '../helpers'
import {handleNewPoolOutputEvents} from '../helpers/pool'
import {txOutRefToUtxoInput} from '../helpers/utxo'
import {calculatePoolOutputVolume} from '../helpers/volume'
import {emitInteractionUpdated} from '../interactions-updates'
import {logger} from '../logger'
import {emitPoolUpdatesOnRollback} from '../pools-updates'
import {handleCrossServiceEvent} from '../redis/helpers'
import {PubSubChannel} from '../redis/pubsub'
import {updateChainSyncStatus} from './chain-sync-status'
import {
  clearAssetsAdaExchangeRatesCache,
  initAssetAdaExchangeRatesCache,
  updateAdaExchangeRateForPool,
} from './exchange-rates-cache'
import {getSpentPoolInteractionType, isPoolOutput} from './helpers'
import {
  clearMempoolCache,
  deleteMempoolPoolOutput,
  getLatestMempoolPoolOutput,
} from './mempool'
import {getOgmiosContext} from './ogmios'
import {ogmiosMetadataToJson} from './ogmios-metadata-to-json'
import {ogmiosValueToMeshAssets} from './ogmios-value-to-mesh-assets'
import {parseOgmiosScript} from './parse-ogmios-script'
import {
  addPoolOutputToCache,
  getPoolOutputCacheEntry,
  initPoolOutputCache,
  poolOutputExists,
  removePoolOutputFromCache,
} from './pool-output-cache'

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

  if (block.transactions)
    block.transactions?.forEach((tx) => {
      const spentPoolInputRef = tx.inputs.find((input) =>
        poolOutputExists(getUtxoId(txOutRefToUtxoInput(input))),
      )
      const spentPoolInput = spentPoolInputRef
        ? getPoolOutputCacheEntry(
            getUtxoId(txOutRefToUtxoInput(spentPoolInputRef)),
          )
        : null

      const poolOutputIndex = tx.outputs.findIndex(isPoolOutput)
      if (poolOutputIndex === -1) return
      const poolOutput = tx.outputs[poolOutputIndex]!
      const compensationOutput = tx.outputs.find(
        (_, index) => index !== poolOutputIndex,
      )
      if (!compensationOutput) {
        logger.error({txHash: tx.id}, 'Compensation output not found')
        return
      }

      // since it's a valid pool output it must have datum
      const datum = poolOutput.datum!
      const poolDatum = poolDatumFromCbor(datum)
      const isAdaPool = poolDatum.aAssetName === ''

      const poolUtxoId = getUtxoId({
        txHash: tx.id,
        outputIndex: poolOutputIndex,
      })
      const script = parseOgmiosScript(poolOutput.script)

      const lpts =
        poolOutput.value[poolValidatorHash]![poolDatum.sharesAssetName]!
      const qtyA = isAdaPool
        ? bigNumberToBigInt(
            new BigNumber(poolOutput.value.ada.lovelace.toString()).minus(
              poolOil,
            ),
          )
        : poolOutput.value[poolDatum.aPolicyId]![poolDatum.aAssetName]!
      const qtyB = poolOutput.value[poolDatum.bPolicyId]![poolDatum.bAssetName]!

      let createdByStakeKeyHash: string | null = null
      try {
        createdByStakeKeyHash =
          deserializeAddress(compensationOutput.address).stakeCredentialHash ||
          null
      } catch {
        logger.error(
          {txHash: tx.id},
          'Found compensation output on an address without staking part',
        )
      }
      const interactionType = spentPoolInput
        ? getSpentPoolInteractionType(tx.redeemers)
        : PoolInteractionType.Create

      const qtyADiff = spentPoolInput ? qtyA - spentPoolInput.qtyA : qtyA
      const qtyBDiff = spentPoolInput ? qtyB - spentPoolInput.qtyB : qtyB

      const dbPoolOutput: PoolOutput = {
        utxoId: poolUtxoId,
        spendUtxoId: null,
        slot: block.slot,
        spendSlot: null,
        shareAssetName: poolDatum.sharesAssetName,
        assetAPolicy: poolDatum.aPolicyId,
        assetAName: poolDatum.aAssetName,
        assetBPolicy: poolDatum.bPolicyId,
        assetBName: poolDatum.bAssetName,
        lpts,
        qtyA,
        qtyB,
        feeFrom: feeFromToDbFeeFrom(poolDatum.feeFrom),
        swapFeePointsAToB: poolDatum.swapFeePointsAToB,
        swapFeePointsBToA: poolDatum.swapFeePointsBToA,
        feeBasis: poolDatum.feeBasis,
        address: poolOutput.address,
        assets: ogmiosValueToMeshAssets(poolOutput.value),
        coins: poolOutput.value.ada.lovelace,
        datumCBOR: datum,
        txMetadata: ogmiosMetadataToJson(tx) ?? null,
        scriptVersion: script?.version ?? null,
        scriptCBOR: script?.cbor ?? null,
        interactionType,
        createdByStakeKeyHash,
        lptsDiff: spentPoolInput ? lpts - spentPoolInput.lpts : lpts,
        qtyADiff,
        qtyBDiff,
        ...calculatePoolOutputVolume({
          interactionType,
          qtyADiff,
          qtyBDiff,
        }),
      }

      addPoolOutputToCache(poolUtxoId, {
        shareAssetName: poolDatum.sharesAssetName,
        qtyA: dbPoolOutput.qtyA,
        qtyB: dbPoolOutput.qtyB,
        lpts: dbPoolOutput.lpts,
      })

      if (
        isFullySynced &&
        // emit pools updates only there isn't a newer pool output in the mempool
        getLatestMempoolPoolOutput(poolDatum.sharesAssetName, poolUtxoId) ==
          null
      ) {
        handleNewPoolOutputEvents({
          poolOutput: dbPoolOutput,
          hasSpentPoolInput: spentPoolInput != null,
        })
      }

      if (isFullySynced && dbPoolOutput.createdByStakeKeyHash) {
        handleCrossServiceEvent(
          PubSubChannel.INTERACTION_UPDATED,
          {
            interaction: poolOutputToInteraction(dbPoolOutput),
            stakeKeyHash: dbPoolOutput.createdByStakeKeyHash,
          },
          emitInteractionUpdated,
        )
      }

      updateAdaExchangeRateForPool({
        unitA: createUnit(dbPoolOutput.assetAPolicy, dbPoolOutput.assetAName),
        unitB: createUnit(dbPoolOutput.assetBPolicy, dbPoolOutput.assetBName),
        shareAssetName: dbPoolOutput.shareAssetName,
        poolState: {
          qtyA: bigintToBigNumber(dbPoolOutput.qtyA),
          qtyB: bigintToBigNumber(dbPoolOutput.qtyB),
        },
      })
      // pool output is confirmed on chain, we can remove it from the mempool pool outputs
      deleteMempoolPoolOutput(poolDatum.sharesAssetName, poolUtxoId)
      poolOutputBuffer.push(dbPoolOutput)

      // Mark spent pool outputs
      tx.inputs
        .map((input) => getUtxoId(txOutRefToUtxoInput(input)))
        .filter(poolOutputExists)
        .forEach((utxoId) => {
          const entry = getPoolOutputCacheEntry(utxoId)
          if (!entry) {
            return
          }
          // findLast because the last aggregate pool output is the one that was spent
          const spendUtxoId = poolOutputBuffer.findLast(
            (poolOutput) => poolOutput.shareAssetName === entry.shareAssetName,
          )?.utxoId
          if (spendUtxoId == null) {
            // should never happen because if the pool output was spent
            // a new pool output must be aggregated in the same tx
            const msg = `Spend UTxO not found: utxoId = ${utxoId}, shareAssetName = ${entry.shareAssetName} `
            logger.error({utxoId, entry}, msg)
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
  clearMempoolCache()
  clearAssetsAdaExchangeRatesCache()

  const affectedPoolOutputs = await prisma.poolOutput.findMany({
    select: {
      shareAssetName: true,
    },
    distinct: ['shareAssetName'],
    where: {
      slot: {
        gt: rollbackSlot,
      },
    },
  })

  await prisma.$transaction((prismaTx) =>
    prismaTx.block.deleteMany({where: {slot: {gt: rollbackSlot}}}),
  )

  // (Re-)Initialize the cache
  await initPoolOutputCache()
  await initAssetAdaExchangeRatesCache()

  await emitPoolUpdatesOnRollback(affectedPoolOutputs)
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

        updateChainSyncStatus(response.tip, response.block.height)
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
