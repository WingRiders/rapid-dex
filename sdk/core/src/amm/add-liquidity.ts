import type {PoolState} from '@wingriders/rapid-dex-common'
import BigNumber from 'bignumber.js'

export type ComputeEarnedSharesParams = {
  lockA: BigNumber
  lockB: BigNumber
  poolState: PoolState
}

/**
 * @param lockA The amount of token A to add to the pool.
 * @param lockB The amount of token B to add to the pool.
 * @param poolState The current state of the pool.
 * @returns The number of share tokens that the user will receive when adding the given liquidity amount into the given pool state.
 */
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
