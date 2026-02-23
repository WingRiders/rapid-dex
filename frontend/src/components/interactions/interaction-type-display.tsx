import {InteractionType} from '@wingriders/rapid-dex-common'

type InteractionTypeDisplayProps = {
  type: InteractionType
}

export const InteractionTypeDisplay = ({type}: InteractionTypeDisplayProps) => {
  switch (type) {
    case InteractionType.CREATE_POOL:
      return 'Create pool'
    case InteractionType.SWAP:
      return 'Swap'
    case InteractionType.ADD_LIQUIDITY:
      return 'Add liquidity'
    case InteractionType.WITHDRAW_LIQUIDITY:
      return 'Withdraw liquidity'
    case InteractionType.WITHDRAW_TREASURY:
      return 'Withdraw treasury'
    case InteractionType.DONATE:
      return 'Donate'
  }
}
