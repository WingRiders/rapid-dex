import {type Interaction, InteractionType} from '@wingriders/rapid-dex-common'

type InteractionTypeDisplayProps = {
  interaction: Interaction
}

export const InteractionTypeDisplay = ({
  interaction,
}: InteractionTypeDisplayProps) => {
  switch (interaction.type) {
    case InteractionType.CREATE_POOL:
      return 'Create pool'
    case InteractionType.SWAP:
      return 'Swap'
    case InteractionType.ADD_LIQUIDITY:
      return interaction.lockA.eq(0) || interaction.lockB.eq(0)
        ? 'Zap In'
        : 'Add liquidity'
    case InteractionType.WITHDRAW_LIQUIDITY:
      return interaction.outA.eq(0) || interaction.outB.eq(0)
        ? 'Zap Out'
        : 'Withdraw liquidity'
    case InteractionType.WITHDRAW_TREASURY:
      return 'Withdraw treasury'
    case InteractionType.DONATE:
      return 'Donate'
  }
}
