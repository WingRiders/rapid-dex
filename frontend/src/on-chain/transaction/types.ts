import type {UTxO} from '@meshsdk/core'
import type {PoolsListItem} from '../../types'

export type PoolInteractionTxPool = Pick<
  PoolsListItem,
  'unitA' | 'unitB' | 'shareAssetName' | 'poolState'
> & {
  utxo: UTxO
}
