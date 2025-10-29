import type {Asset} from '@meshsdk/core'
import {isLovelaceUnit} from '@wingriders/rapid-dex-common'
import BigNumber from 'bignumber.js'
import {maxBy} from 'lodash'
import type {AssetsAdaExchangeRates} from './exchange-rates'

export const getAdaValueFactory = (
  assetsAdaExchangeRates: AssetsAdaExchangeRates,
) => {
  return (
    assets: Asset[],
    /** ADA pool which should be used to calculate the change rate. If not provided, ADA pool with the highest quantity of ADA will be used. */
    poolShareAssetName: string | undefined,
  ) => {
    if (assets.length === 0) return undefined

    const adaValues = assets.map((asset) => {
      let exchangeRate: BigNumber | undefined

      if (isLovelaceUnit(asset.unit)) exchangeRate = new BigNumber(1)
      else if (assetsAdaExchangeRates[asset.unit]) {
        if (poolShareAssetName) {
          exchangeRate =
            assetsAdaExchangeRates[asset.unit]![poolShareAssetName]
              ?.exchangeRate
        } else {
          // pick the exchange rate from the pool with the highest quantity of ADA
          const exchangeRates = Object.values(
            assetsAdaExchangeRates[asset.unit]!,
          )
          exchangeRate = maxBy(exchangeRates, (r) => r.pool.qtyA)?.exchangeRate
        }
      }

      return exchangeRate?.times(asset.quantity)
    })
    return adaValues.includes(undefined)
      ? undefined
      : BigNumber.sum(...(adaValues as BigNumber[]))
  }
}
