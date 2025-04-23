import {createMempoolMonitoringClient} from '@cardano-ogmios/client'
import type {
  Transaction,
  TransactionOutputReference,
} from '@cardano-ogmios/schema'
import {
  getUtxoId,
  poolDatumFromCbor,
  poolOil,
  poolValidatorHash,
} from '@wingriders/rapid-dex-common'
import BigNumber from 'bignumber.js'
import {handleNewPoolOutputEvents} from '../helpers/pool'
import {txOutRefToUtxoInput} from '../helpers/utxo'
import {logger} from '../logger'
import {waitUntilChainSynced} from './chainSyncStatus'
import {isPoolOutput} from './helpers'
import {
  type MempoolPoolOutput,
  clearMempoolPoolOutputs,
  getMempoolPoolOutputsForPool,
  updateMempoolPoolOutputsForPool,
} from './mempoolCache'
import {getOgmiosContext} from './ogmios'
import {ogmiosValueToMeshAssets} from './ogmiosValueToMeshAssets'
import {parseOgmiosScript} from './parseOgmiosScript'
import {poolOutputExists} from './poolOutputCache'

const MAX_MEMPOOL_TXS = 10_000

const mempoolPooOutputsUtxoIds = new Set<string>()

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
    for (const transaction of transactions) {
      await processMempoolTransaction(transaction)
    }
  }
}

const isPoolInput = (input: TransactionOutputReference) => {
  const inputUtxoId = getUtxoId(txOutRefToUtxoInput(input))
  return (
    poolOutputExists(inputUtxoId) || mempoolPooOutputsUtxoIds.has(inputUtxoId)
  )
}

const processMempoolTransaction = async (tx: Transaction) => {
  tx.outputs.forEach((output, outputIndex) => {
    if (isPoolOutput(output)) {
      const spentPoolInput = tx.inputs.find(isPoolInput)
      // since it's a valid pool output it must have datum
      const datum = output.datum!
      const poolDatum = poolDatumFromCbor(datum)
      const isAdaPool = poolDatum.aAssetName === ''

      const poolUtxoId = getUtxoId({txHash: tx.id, outputIndex})
      const script = parseOgmiosScript(output.script)

      const poolOutput: MempoolPoolOutput = {
        utxoId: poolUtxoId,
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
        scriptVersion: script?.version ?? null,
        scriptCBOR: script?.cbor ?? null,
        spentPoolInputUtxoId: spentPoolInput
          ? getUtxoId(txOutRefToUtxoInput(spentPoolInput))
          : undefined,
      }

      logger.info({poolOutput}, 'Inserting mempool pool output')
      insertMempoolPoolOutput(poolDatum.sharesAssetName, poolOutput)

      handleNewPoolOutputEvents({
        poolOutput,
        poolDatum,
        hasSpentPoolInput: spentPoolInput != null,
      })
    }
  })
}

const insertMempoolPoolOutput = (
  poolShareAssetName: string,
  poolOutput: MempoolPoolOutput,
) => {
  updateMempoolPoolOutputsForPool(poolShareAssetName, (current) => [
    ...(current ?? []),
    poolOutput,
  ])
  mempoolPooOutputsUtxoIds.add(poolOutput.utxoId)
}

export const deleteMempoolPoolOutput = (
  poolShareAssetName: string,
  poolUtxoId: string,
) => {
  updateMempoolPoolOutputsForPool(poolShareAssetName, (current) =>
    current?.filter((o) => o.utxoId !== poolUtxoId),
  )
  mempoolPooOutputsUtxoIds.delete(poolUtxoId)
}

/**
 * Returns the latest mempool pool output in the chain of pool outputs that starts with the given dbPoolOutputUtxoId
 */
export const getLatestMempoolPoolOutput = (
  poolShareAssetName: string,
  dbPoolOutputUtxoId: string,
): MempoolPoolOutput | undefined => {
  const poolOutputs = getMempoolPoolOutputsForPool(poolShareAssetName)
  if (poolOutputs == null) return undefined

  return getLatestMempoolPoolOutputRec(poolOutputs, dbPoolOutputUtxoId)
}

const getLatestMempoolPoolOutputRec = (
  poolOutputs: MempoolPoolOutput[],
  lastOutputId: string,
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
  mempoolPooOutputsUtxoIds.clear()
}
