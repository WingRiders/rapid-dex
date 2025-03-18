import {createUnit} from '../helpers/asset'
import {useTokenMetadata} from '../metadata/queries'
import type {PoolsListItem} from '../types'
import {AssetQuantity} from './asset-quantity'

type PoolPriceProps = {
  pool: Pick<
    PoolsListItem,
    | 'assetAPolicy'
    | 'assetAName'
    | 'assetBPolicy'
    | 'assetBName'
    | 'qtyA'
    | 'qtyB'
  >
}

export const PoolPrice = ({pool}: PoolPriceProps) => {
  const unitA = createUnit(pool.assetAPolicy, pool.assetAName)
  const unitB = createUnit(pool.assetBPolicy, pool.assetBName)

  const {metadata: unitBMetadata} = useTokenMetadata(unitB)
  const price = pool.qtyA.div(pool.qtyB).shiftedBy(unitBMetadata?.decimals ?? 0)

  return <AssetQuantity unit={unitA} quantity={price} />
}
