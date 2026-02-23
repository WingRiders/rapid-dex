import type {FeeFrom} from '@wingriders/rapid-dex-common'
import type {AssetInputValue} from '@/components/asset-input/types'

export type CreatePoolFormInputs = {
  assetX: AssetInputValue
  assetY: AssetInputValue
  feeFrom: FeeFrom
  useBidirectionalSwapFee: boolean
  // if useBidirectionalSwapFee is true, this is the swap fee used for both directions
  swapFeePercentageAToB: number
  swapFeePercentageBToA: number
}
