import {FeeFrom} from '@wingriders/rapid-dex-common'
import {computeFee} from '@wingriders/rapid-dex-sdk-core'
import {formatPercentage} from '@/helpers/format-percentage'
import {useTokenMetadata} from '@/metadata/queries'
import {Tooltip, TooltipContent, TooltipTrigger} from './ui/tooltip'

type FeeDisplayProps = {
  feePointsAToB: number
  feePointsBToA: number
  feeBasis: number
  feeFrom: FeeFrom
  unitA: string
  unitB: string
  showOnly?: 'aToB' | 'bToA'
  suffix?: string
}

export const FeeDisplay = ({
  feePointsAToB,
  feePointsBToA,
  feeBasis,
  feeFrom,
  unitA,
  unitB,
  showOnly,
  suffix,
}: FeeDisplayProps) => {
  const {metadata: metadataA} = useTokenMetadata(unitA)
  const {metadata: metadataB} = useTokenMetadata(unitB)

  const unitATicker = metadataA?.ticker ?? metadataA?.name ?? 'unknown'
  const unitBTicker = metadataB?.ticker ?? metadataB?.name ?? 'unknown'

  const feePercentageAToB = formatPercentage(
    computeFee(feePointsAToB, feeBasis).times(100),
  )
  const feePercentageBToA = formatPercentage(
    computeFee(feePointsBToA, feeBasis).times(100),
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
        {showOnly === 'aToB' || feePointsAToB === feePointsBToA
          ? feePercentageAToB
          : showOnly === 'bToA'
            ? feePercentageBToA
            : `${feePercentageAToB} / ${feePercentageBToA}`}
        {suffix && ` ${suffix}`}
      </TooltipTrigger>
      <TooltipContent>
        <div>
          {feePointsAToB !== feePointsBToA && (
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
