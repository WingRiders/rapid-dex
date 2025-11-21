import type {FeeFrom} from '@wingriders/rapid-dex-common'
import type {AssetInputValue} from '@/components/asset-input/types'

export type CreatePoolFormInputs = {
  errorField: unknown
  assetX: AssetInputValue
  assetY: AssetInputValue
  feeFrom: FeeFrom
  swapFeePercentageAToB: number
  swapFeePercentageBToA: number
}
