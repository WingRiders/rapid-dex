import {maxShareTokens} from '@wingriders/rapid-dex-common'
import BigNumber from 'bignumber.js'

type ComputeEarnedSharesParams = {
  lockA: BigNumber
  lockB: BigNumber
  currentA: BigNumber
  currentB: BigNumber
  currentShares: BigNumber
}

export const computeEarnedShares = ({
  lockA,
  lockB,
  currentA,
  currentB,
  currentShares,
}: ComputeEarnedSharesParams) => {
  const totalEmittedShares = maxShareTokens.minus(currentShares)
  const computeEarnedSharesFromOneToken = (
    lockX: BigNumber,
    currentX: BigNumber,
  ) =>
    lockX
      .multipliedBy(totalEmittedShares)
      .dividedBy(currentX)
      .integerValue(BigNumber.ROUND_FLOOR)
  const earnedSharesFromA = computeEarnedSharesFromOneToken(lockA, currentA)
  const earnedSharesFromB = computeEarnedSharesFromOneToken(lockB, currentB)
  return BigNumber.min(earnedSharesFromA, earnedSharesFromB)
}
