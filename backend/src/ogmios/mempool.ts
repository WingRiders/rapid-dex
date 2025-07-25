import {createMempoolMonitoringClient} from '@cardano-ogmios/client'
import type {
  Transaction,
  TransactionOutputReference,
} from '@cardano-ogmios/schema'
import {deserializeAddress} from '@meshsdk/core'
import {
  bigNumberToBigInt,
  bigintToBigNumber,
  createUnit,
  getUtxoId,
  poolDatumFromCbor,
  poolOil,
  poolValidatorHash,
} from '@wingriders/rapid-dex-common'
import BigNumber from 'bignumber.js'
import {PoolInteractionType} from '../db/prismaClient'
import {poolOutputToInteraction} from '../endpoints/interactions'
import {handleNewPoolOutputEvents} from '../helpers/pool'
import {txOutRefToUtxoInput} from '../helpers/utxo'
import {calculatePoolOutputVolume} from '../helpers/volume'
import {emitInteractionUpdated} from '../interactionsUpdates'
import {logger} from '../logger'
import {handleCrossServiceEvent} from '../redis/helpers'
import {PubSubChannel} from '../redis/pubsub'
import {waitUntilChainSynced} from './chainSyncStatus'
import {updateAdaExchangeRateForPool} from './exchangeRatesCache'
import {getSpentPoolInteractionType, isPoolOutput} from './helpers'
import {
  type MempoolPoolOutput,
  type MempoolPoolOutputs,
  clearMempoolPoolOutputs,
  getMempoolPoolOutputsForPool,
  updateMempoolPoolOutputs,
  updateMempoolPoolOutputsForPool,
} from './mempoolCache'
import {getOgmiosContext} from './ogmios'
import {ogmiosValueToMeshAssets} from './ogmiosValueToMeshAssets'
import {parseOgmiosScript} from './parseOgmiosScript'
import {getPoolOutputCacheEntry} from './poolOutputCache'

const MAX_MEMPOOL_TXS = 10_000

// different from mempoolPoolOutputs in mempoolCache.ts, this is used only for aggregation and is grouped by utxoId
const mempoolPoolOutputs = new Map<
  string,
  {
    qtyA: bigint
    qtyB: bigint
    lpts: bigint
  }
>()

export const startMempoolMonitoring = async () => {
  logger.info('Starting mempool monitoring')
  const ogmiosContext = await getOgmiosContext()
  const mempoolMonitoringClient =
    await createMempoolMonitoringClient(ogmiosContext)

  const flushMempool = async () => {
    const transactions = []
    for (let i = 0; i < MAX_MEMPOOL_TXS; i++) {
      const transaction = await mempoolMonitoringClient.nextTransaction({
        fields: 'all',
      })
      if (transaction == null) return transactions
      transactions.push(transaction)
    }
    return transactions
  }

  await waitUntilChainSynced()

  while (true) {
    await mempoolMonitoringClient.acquireMempool()
    // acquireMempool() is blocking until there is a mempool update
    // so we again wait until db is synced in case there was a rollback while acquiring the mempool
    await waitUntilChainSynced()
    const transactions = await flushMempool()

    const newMempoolPoolOutputs: MempoolPoolOutputs = {}
    mempoolPoolOutputs.clear()
    for (const transaction of transactions) {
      const newPoolOutput = processMempoolTransaction(transaction)

      if (newPoolOutput) {
        logger.info({newPoolOutput}, 'Found mempool pool output')

        if (!newMempoolPoolOutputs[newPoolOutput.shareAssetName]) {
          newMempoolPoolOutputs[newPoolOutput.shareAssetName] = []
        }
        newMempoolPoolOutputs[newPoolOutput.shareAssetName]!.push(newPoolOutput)

        mempoolPoolOutputs.set(newPoolOutput.utxoId, {
          qtyA: newPoolOutput.qtyA,
          qtyB: newPoolOutput.qtyB,
          lpts: newPoolOutput.lpts,
        })
      }
    }

    updateMempoolPoolOutputs(newMempoolPoolOutputs)

    Object.keys(newMempoolPoolOutputs).map((shareAssetName) => {
      const poolOutputsForPool = newMempoolPoolOutputs[shareAssetName]
      if (!poolOutputsForPool || poolOutputsForPool.length === 0) return

      // Push updates only for the latest pool output
      const latestPoolOutput =
        getLatestMempoolPoolOutputRec(
          poolOutputsForPool,
          poolOutputsForPool[0]!.utxoId,
        ) ?? poolOutputsForPool[0]!

      if (latestPoolOutput) {
        updateAdaExchangeRateForPool({
          unitA: createUnit(
            latestPoolOutput.assetAPolicy,
            latestPoolOutput.assetAName,
          ),
          unitB: createUnit(
            latestPoolOutput.assetBPolicy,
            latestPoolOutput.assetBName,
          ),
          shareAssetName: latestPoolOutput.shareAssetName,
          poolState: {
            qtyA: bigintToBigNumber(latestPoolOutput.qtyA),
            qtyB: bigintToBigNumber(latestPoolOutput.qtyB),
          },
        })

        handleNewPoolOutputEvents({
          poolOutput: latestPoolOutput,
          hasSpentPoolInput: latestPoolOutput.spentPoolInputUtxoId != null,
        })

        if (latestPoolOutput.createdByStakeKeyHash) {
          handleCrossServiceEvent(
            PubSubChannel.INTERACTION_UPDATED,
            {
              interaction: poolOutputToInteraction(latestPoolOutput),
              stakeKeyHash: latestPoolOutput.createdByStakeKeyHash,
            },
            emitInteractionUpdated,
          )
        }
      }
    })
  }
}

const getSpentPoolInput = (txInputs: TransactionOutputReference[]) => {
  for (const input of txInputs) {
    const inputUtxoId = getUtxoId(txOutRefToUtxoInput(input))

    const dbPoolOutput = getPoolOutputCacheEntry(inputUtxoId)
    if (dbPoolOutput != null) {
      return {
        ...dbPoolOutput,
        ref: input,
      }
    }

    const mempoolPoolOutput = mempoolPoolOutputs.get(inputUtxoId)
    if (mempoolPoolOutput != null) {
      return {
        ...mempoolPoolOutput,
        ref: input,
      }
    }
  }
}

const processMempoolTransaction = (
  tx: Transaction,
): MempoolPoolOutput | undefined => {
  const spentPoolInput = getSpentPoolInput(tx.inputs)

  const poolOutputIndex = tx.outputs.findIndex(isPoolOutput)
  if (poolOutputIndex === -1) return undefined
  const poolOutput = tx.outputs[poolOutputIndex]!
  const compensationOutput = tx.outputs.find(
    (_, index) => index !== poolOutputIndex,
  )
  if (!compensationOutput) {
    logger.error({txHash: tx.id}, 'Compensation output not found')
    return undefined
  }

  // since it's a valid pool output it must have datum
  const datum = poolOutput.datum!
  const poolDatum = poolDatumFromCbor(datum)
  const isAdaPool = poolDatum.aAssetName === ''

  const poolUtxoId = getUtxoId({txHash: tx.id, outputIndex: poolOutputIndex})
  const script = parseOgmiosScript(poolOutput.script)

  const lpts = poolOutput.value[poolValidatorHash]![poolDatum.sharesAssetName]!
  const qtyA = isAdaPool
    ? bigNumberToBigInt(
        new BigNumber(poolOutput.value.ada.lovelace.toString()).minus(poolOil),
      )
    : poolOutput.value[poolDatum.aPolicyId]![poolDatum.aAssetName]!
  const qtyB = poolOutput.value[poolDatum.bPolicyId]![poolDatum.bAssetName]!

  let createdByStakeKeyHash: string | null = null
  try {
    createdByStakeKeyHash =
      deserializeAddress(compensationOutput.address).stakeCredentialHash || null
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

  const mempoolPoolOutput: MempoolPoolOutput = {
    utxoId: poolUtxoId,
    shareAssetName: poolDatum.sharesAssetName,
    assetAPolicy: poolDatum.aPolicyId,
    assetAName: poolDatum.aAssetName,
    assetBPolicy: poolDatum.bPolicyId,
    assetBName: poolDatum.bAssetName,
    lpts,
    qtyA,
    qtyB,
    swapFeePoints: poolDatum.swapFeePoints,
    feeBasis: poolDatum.feeBasis,
    address: poolOutput.address,
    assets: ogmiosValueToMeshAssets(poolOutput.value),
    coins: poolOutput.value.ada.lovelace,
    datumCBOR: datum,
    scriptVersion: script?.version ?? null,
    scriptCBOR: script?.cbor ?? null,
    spentPoolInputUtxoId: spentPoolInput
      ? getUtxoId(txOutRefToUtxoInput(spentPoolInput.ref))
      : undefined,
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

  return mempoolPoolOutput
}

export const deleteMempoolPoolOutput = (
  poolShareAssetName: string,
  poolUtxoId: string,
) => {
  updateMempoolPoolOutputsForPool(poolShareAssetName, (current) =>
    current?.filter((o) => o.utxoId !== poolUtxoId),
  )
  mempoolPoolOutputs.delete(poolUtxoId)
}

/**
 * Returns the latest mempool pool output in the chain of pool outputs that starts with the given dbPoolOutputUtxoId
 */
export const getLatestMempoolPoolOutput = (
  poolShareAssetName: string,
  dbPoolOutputUtxoId: string | undefined,
): MempoolPoolOutput | undefined => {
  const poolOutputs = getMempoolPoolOutputsForPool(poolShareAssetName)
  if (poolOutputs == null) return undefined

  return getLatestMempoolPoolOutputRec(poolOutputs, dbPoolOutputUtxoId)
}

const getLatestMempoolPoolOutputRec = (
  poolOutputs: MempoolPoolOutput[],
  lastOutputId: string | undefined,
): MempoolPoolOutput | undefined => {
  const foundMempoolPoolOutput = poolOutputs.find(
    (mempoolPoolOutput) =>
      mempoolPoolOutput.spentPoolInputUtxoId === lastOutputId,
  )
  if (foundMempoolPoolOutput == null) return undefined
  return (
    getLatestMempoolPoolOutputRec(poolOutputs, foundMempoolPoolOutput.utxoId) ??
    foundMempoolPoolOutput
  )
}

export const clearMempoolCache = () => {
  clearMempoolPoolOutputs()
  mempoolPoolOutputs.clear()
}
