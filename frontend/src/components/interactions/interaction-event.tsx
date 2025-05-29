import {type Interaction, InteractionType} from '@wingriders/rapid-dex-common'
import {ArrowRightIcon, PlusIcon} from 'lucide-react'
import {AssetQuantity} from '../asset-quantity'

type InteractionEventProps = {
  interaction: Interaction
}

export const InteractionEvent = ({interaction}: InteractionEventProps) => {
  switch (interaction.type) {
    case InteractionType.CREATE_POOL:
      return <CreatePoolEvent interaction={interaction} />
    case InteractionType.SWAP:
      return <SwapEvent interaction={interaction} />
    case InteractionType.ADD_LIQUIDITY:
      return <AddLiquidityEvent interaction={interaction} />
    case InteractionType.WITHDRAW_LIQUIDITY:
      return <WithdrawLiquidityEvent interaction={interaction} />
    case InteractionType.DONATE:
      return <DonateEvent interaction={interaction} />
  }
}

type SpecificInteractionEventProps<TType extends InteractionType> = {
  interaction: Extract<Interaction, {type: TType}>
}

const CreatePoolEvent = ({
  interaction: {pool, qtyA, qtyB},
}: SpecificInteractionEventProps<InteractionType.CREATE_POOL>) => {
  return (
    <div className="flex items-center gap-2">
      <AssetQuantity unit={pool.unitA} quantity={qtyA} />
      <PlusIcon className="size-4" />
      <AssetQuantity unit={pool.unitB} quantity={qtyB} />
    </div>
  )
}

const SwapEvent = ({
  interaction: {pool, aToB, lockX, outY},
}: SpecificInteractionEventProps<InteractionType.SWAP>) => {
  const [fromUnit, toUnit] = aToB
    ? [pool.unitA, pool.unitB]
    : [pool.unitB, pool.unitA]

  return (
    <div className="flex items-center gap-2">
      <AssetQuantity unit={fromUnit} quantity={lockX} />
      <ArrowRightIcon className="size-4" />
      <AssetQuantity unit={toUnit} quantity={outY} />
    </div>
  )
}

const AddLiquidityEvent = ({
  interaction: {pool, lockA, lockB},
}: SpecificInteractionEventProps<InteractionType.ADD_LIQUIDITY>) => {
  return (
    <div className="flex items-center gap-2">
      <AssetQuantity unit={pool.unitA} quantity={lockA} />
      <PlusIcon className="size-4" />
      <AssetQuantity unit={pool.unitB} quantity={lockB} />
    </div>
  )
}

const WithdrawLiquidityEvent = ({
  interaction: {pool, outA, outB},
}: SpecificInteractionEventProps<InteractionType.WITHDRAW_LIQUIDITY>) => {
  return (
    <div className="flex items-center gap-2">
      <AssetQuantity unit={pool.unitA} quantity={outA} />
      <PlusIcon className="size-4" />
      <AssetQuantity unit={pool.unitB} quantity={outB} />
    </div>
  )
}

const DonateEvent = ({
  interaction: {pool, donatedA, donatedB},
}: SpecificInteractionEventProps<InteractionType.DONATE>) => {
  return (
    <div className="flex items-center gap-2">
      <AssetQuantity unit={pool.unitA} quantity={donatedA} />
      <PlusIcon className="size-4" />
      <AssetQuantity unit={pool.unitB} quantity={donatedB} />
    </div>
  )
}
