import type {PoolState} from '@wingriders/rapid-dex-common'
import BigNumber from 'bignumber.js'

export type ComputeEarnedSharesParams = {
  lockA: BigNumber
  lockB: BigNumber
  poolState: PoolState
}

export const computeEarnedShares = ({
  lockA,
  lockB,
  poolState,
}: ComputeEarnedSharesParams) => {
  const computeEarnedSharesFromOneToken = (
    lockX: BigNumber,
    currentX: BigNumber,
  ) =>
    lockX
      .multipliedBy(poolState.issuedShares)
      .dividedBy(currentX)
      .integerValue(BigNumber.ROUND_FLOOR)
  const earnedSharesFromA = computeEarnedSharesFromOneToken(
    lockA,
    poolState.qtyA,
  )
  const earnedSharesFromB = computeEarnedSharesFromOneToken(
    lockB,
    poolState.qtyB,
  )
  return BigNumber.min(earnedSharesFromA, earnedSharesFromB)
}
