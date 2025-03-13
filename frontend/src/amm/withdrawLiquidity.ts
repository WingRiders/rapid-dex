import {maxShareTokens} from '@wingriders/rapid-dex-common'
import BigNumber from 'bignumber.js'

type ComputeWithdrawnTokensParams = {
  lockShares: BigNumber
  currentA: BigNumber
  currentB: BigNumber
  currentShares: BigNumber
}

export const computeReturnedTokens = ({
  lockShares,
  currentA,
  currentB,
  currentShares,
}: ComputeWithdrawnTokensParams) => {
  const totalEmittedShares = maxShareTokens.minus(currentShares)
  const computeTokenReturn = (currentX: BigNumber) =>
    lockShares
      .multipliedBy(currentX)
      .dividedBy(totalEmittedShares)
      .integerValue(BigNumber.ROUND_FLOOR)

  const outA = computeTokenReturn(currentA)
  const outB = computeTokenReturn(currentB)
  return {outA, outB}
}
