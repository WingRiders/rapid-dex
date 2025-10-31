import type {PoolState} from '@wingriders/rapid-dex-common'
import BigNumber from 'bignumber.js'

export type ComputeWithdrawnTokensParams = {
  lockShares: BigNumber
  poolState: PoolState
}

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
