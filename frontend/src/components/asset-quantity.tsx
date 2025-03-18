import type {Unit} from '@meshsdk/core'
import type BigNumber from 'bignumber.js'
import {
  type FormatAssetQuantityOptions,
  getAssetQuantityFormatter,
} from '../helpers/format-asset-quantity'
import {useTokenMetadata} from '../metadata/queries'

type AssetQuantityProps = {
  unit: Unit
  quantity: BigNumber
} & FormatAssetQuantityOptions

export const AssetQuantity = ({
  unit,
  quantity,
  ...options
}: AssetQuantityProps) => {
  const {metadata} = useTokenMetadata(unit)
  const formatQuantity = getAssetQuantityFormatter(metadata)

  return <>{formatQuantity(quantity, options)}</>
}
