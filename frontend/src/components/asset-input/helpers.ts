import type {Asset, Unit} from '@meshsdk/core'
import type BigNumber from 'bignumber.js'
import type {AssetInputValue} from './types'

export const isAssetInputValueNonEmpty = (
  value: AssetInputValue,
): value is {unit: Unit; quantity: BigNumber} =>
  value.unit != null && value.quantity != null

export const assetInputValueToAsset = (value: AssetInputValue): Asset => {
  if (!value.unit || !value.quantity) {
    throw new Error('Asset input value is not non-empty')
  }
  return {
    unit: value.unit,
    quantity: value.quantity.toString(),
  }
}
