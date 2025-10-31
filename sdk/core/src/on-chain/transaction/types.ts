import type {UTxO} from '@meshsdk/core'
import type {PoolState} from '@wingriders/rapid-dex-common'

export type PoolInteractionTxPool = {
  unitA: string
  unitB: string
  shareAssetName: string
  poolState: PoolState
  utxo: UTxO
}
