import type {PoolState} from '@wingriders/rapid-dex-common'
import BigNumber from 'bignumber.js'

export type ComputeWithdrawnTokensParams = {
  lockShares: BigNumber
  poolState: PoolState
}

/**
 * @param lockShares The amount of share tokens to withdraw.
 * @param poolState The current state of the pool.
 * @returns The amount of pool tokens that the user will receive when withdrawing the given amount of share tokens from the given pool state.
 */
export const computeReturnedTokens = ({
  lockShares,
  poolState,
}: ComputeWithdrawnTokensParams) => {
  const computeTokenReturn = (currentX: BigNumber) =>
    lockShares
      .multipliedBy(currentX)
      .dividedBy(poolState.issuedShares)
      .integerValue(BigNumber.ROUND_FLOOR)

  const outA = computeTokenReturn(poolState.qtyA)
  const outB = computeTokenReturn(poolState.qtyB)
  return {outA, outB}
}
