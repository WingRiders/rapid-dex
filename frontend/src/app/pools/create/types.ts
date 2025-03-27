import type {AssetInputValue} from '@/components/asset-input/types'

export type CreatePoolFormInputs = {
  errorField: unknown
  assetX: AssetInputValue
  assetY: AssetInputValue
  swapFeePercentage: number
}
