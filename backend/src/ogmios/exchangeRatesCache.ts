import type {Unit} from '@meshsdk/core'
import {
  bigintToBigNumber,
  createUnit,
  type PoolState,
} from '@wingriders/rapid-dex-common'
import {isOnlyAggregatorMode} from '../config'
import {prisma} from '../db/prismaClient'
import {
  type AssetsAdaExchangeRates,
  calculateAssetsAdaExchangeRates,
  calculateExchangeRateForPool,
} from '../helpers/exchangeRates'
import {PubSubChannel, publishToPubSub} from '../redis/pubsub'

/** Caching exchange rates so that they can be used when emitting pools updates */
let assetsAdaExchangeRates: AssetsAdaExchangeRates = {}

export const getAssetsAdaExchangeRatesCache = () => assetsAdaExchangeRates

export const initAssetAdaExchangeRatesCache = async () => {
  const poolOutputs = await prisma.poolOutput.findMany({
    where: {
      spendSlot: null,
    },
    select: {
      utxoId: true,
      shareAssetName: true,
      assetAPolicy: true,
      assetAName: true,
      assetBPolicy: true,
      assetBName: true,
      qtyA: true,
      qtyB: true,
    },
  })

  const pools = poolOutputs.map((poolOutput) => {
    return {
      unitA: createUnit(poolOutput.assetAPolicy, poolOutput.assetAName),
      unitB: createUnit(poolOutput.assetBPolicy, poolOutput.assetBName),
      shareAssetName: poolOutput.shareAssetName,
      poolState: {
        qtyA: bigintToBigNumber(poolOutput.qtyA),
        qtyB: bigintToBigNumber(poolOutput.qtyB),
      },
    }
  })

  assetsAdaExchangeRates = calculateAssetsAdaExchangeRates(pools)
}

const handleCacheChanged = async () => {
  if (isOnlyAggregatorMode) {
    await Promise.all([
      publishToPubSub(PubSubChannel.ASSETS_ADA_EXCHANGE_RATES_UPDATED, {
        assetsAdaExchangeRates,
      }),
    ])
  }
}

export const setAssetsAdaExchangeRates = (value: AssetsAdaExchangeRates) => {
  assetsAdaExchangeRates = value
}

export const updateAdaExchangeRateForPool = (pool: {
  unitA: Unit
  unitB: Unit
  shareAssetName: string
  poolState: Pick<PoolState, 'qtyA' | 'qtyB'>
}) => {
  const exchangeRate = calculateExchangeRateForPool(pool)
  if (!exchangeRate) {
    delete assetsAdaExchangeRates[pool.unitB]?.[pool.shareAssetName]
    return
  }

  if (!assetsAdaExchangeRates[pool.unitB])
    assetsAdaExchangeRates[pool.unitB] = {}

  assetsAdaExchangeRates[pool.unitB]![pool.shareAssetName] = {
    exchangeRate,
    pool: {qtyA: pool.poolState.qtyA},
  }

  handleCacheChanged()
}

export const clearAssetsAdaExchangeRatesCache = () => {
  assetsAdaExchangeRates = {}
  handleCacheChanged()
}
