import type {Unit} from '@meshsdk/core'
import type BigNumber from 'bignumber.js'

export type AssetInputItem = {
  unit: Unit
  balance: BigNumber
}

export type AssetInputValue = {
  unit: Unit | null
  quantity: BigNumber | null
}
