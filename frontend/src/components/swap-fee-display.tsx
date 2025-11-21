import {FeeFrom} from '@wingriders/rapid-dex-common'
import {computeFee} from '@wingriders/rapid-dex-sdk-core'
import {formatPercentage} from '@/helpers/format-percentage'
import {useTokenMetadata} from '@/metadata/queries'
import {Tooltip, TooltipContent, TooltipTrigger} from './ui/tooltip'

type SwapFeeDisplayProps = {
  swapFeePointsAToB: number
  swapFeePointsBToA: number
  feeBasis: number
  feeFrom: FeeFrom
  unitA: string
  unitB: string
  showOnly?: 'aToB' | 'bToA'
}

export const SwapFeeDisplay = ({
  swapFeePointsAToB,
  swapFeePointsBToA,
  feeBasis,
  feeFrom,
  unitA,
  unitB,
  showOnly,
}: SwapFeeDisplayProps) => {
  const {metadata: metadataA} = useTokenMetadata(unitA)
  const {metadata: metadataB} = useTokenMetadata(unitB)

  const unitATicker = metadataA?.ticker ?? metadataA?.name ?? 'unknown'
  const unitBTicker = metadataB?.ticker ?? metadataB?.name ?? 'unknown'

  const feePercentageAToB = formatPercentage(
    computeFee(swapFeePointsAToB, feeBasis).times(100),
  )
  const feePercentageBToA = formatPercentage(
    computeFee(swapFeePointsBToA, feeBasis).times(100),
  )

  const feeFromLabel = {
    [FeeFrom.InputToken]: 'the token that you are selling',
    [FeeFrom.OutputToken]: 'the token that you are buying',
    [FeeFrom.TokenA]: unitATicker,
    [FeeFrom.TokenB]: unitBTicker,
  }[feeFrom]

  return (
    <Tooltip>
      <TooltipTrigger>
        {showOnly === 'aToB' || swapFeePointsAToB === swapFeePointsBToA
          ? feePercentageAToB
          : showOnly === 'bToA'
            ? feePercentageBToA
            : `${feePercentageAToB} / ${feePercentageBToA}`}
      </TooltipTrigger>
      <TooltipContent>
        <div>
          {swapFeePointsAToB !== swapFeePointsBToA && (
            <>
              <p>
                {feePercentageAToB} when swapping {unitATicker} to {unitBTicker}
                .
              </p>
              <p>
                {feePercentageBToA} when swapping {unitBTicker} to {unitATicker}
                .
              </p>
            </>
          )}
          <p>Fee is taken from {feeFromLabel}.</p>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}
