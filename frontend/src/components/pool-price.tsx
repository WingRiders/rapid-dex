import {useTokenMetadata} from '../metadata/queries'
import type {PoolsListItem} from '../types'
import {AssetQuantity} from './asset-quantity'

type PoolPriceProps = {
  pool: Pick<PoolsListItem, 'unitA' | 'unitB' | 'poolState'>
}

export const PoolPrice = ({
  pool: {unitA, unitB, poolState},
}: PoolPriceProps) => {
  const {metadata: unitBMetadata} = useTokenMetadata(unitB)
  const price = poolState.qtyA
    .div(poolState.qtyB)
    .shiftedBy(unitBMetadata?.decimals ?? 0)

  return <AssetQuantity unit={unitA} quantity={price} />
}
