import type {Unit} from '@meshsdk/core'
import {type PoolState, isLovelaceUnit} from '@wingriders/rapid-dex-common'
import type BigNumber from 'bignumber.js'
import {ADA_THRESHOLD_TO_IGNORE_EXCHANGE_RATE} from '../constants'

export type AssetsAdaExchangeRates = {
  [unit: Unit]: {
    [poolShareAssetName: string]: {
      exchangeRate: BigNumber
      pool: {qtyA: BigNumber}
    }
  }
}

export const calculateAssetsAdaExchangeRates = (
  pools: {
    shareAssetName: string
    unitA: Unit
    unitB: Unit
    poolState: Pick<PoolState, 'qtyA' | 'qtyB'>
  }[],
): AssetsAdaExchangeRates => {
  const result: AssetsAdaExchangeRates = {}

  pools.forEach(({shareAssetName, unitA, unitB, poolState}) => {
    const exchangeRate = calculateExchangeRateForPool({unitA, poolState})
    if (!exchangeRate) return

    if (!result[unitB]) result[unitB] = {}

    result[unitB][shareAssetName] = {
      exchangeRate,
      pool: {qtyA: poolState.qtyA},
    }
  })

  return result
}

export const calculateExchangeRateForPool = (pool: {
  unitA: Unit
  poolState: Pick<PoolState, 'qtyA' | 'qtyB'>
}) => {
  if (
    !isLovelaceUnit(pool.unitA) ||
    pool.poolState.qtyA.lt(ADA_THRESHOLD_TO_IGNORE_EXCHANGE_RATE)
  )
    return undefined

  return pool.poolState.qtyA.div(pool.poolState.qtyB)
}
