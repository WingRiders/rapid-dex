import {burnedShareTokens} from '@wingriders/rapid-dex-common'
import BigNumber from 'bignumber.js'

export type ComputeSharesCreatePoolParams = {
  lockX: BigNumber
  lockY: BigNumber
}

/**
 * @param lockX The amount of token X to add to the pool.
 * @param lockY The amount of token Y to add to the pool.
 * @returns The number of share tokens that the user will receive when creating a pool with the given liquidity amount (@param lockX and @param lockY).
 */
export const computeSharesCreatePool = ({
  lockX,
  lockY,
}: ComputeSharesCreatePoolParams) => {
  return lockX
    .multipliedBy(lockY)
    .sqrt()
    .integerValue(BigNumber.ROUND_FLOOR)
    .minus(burnedShareTokens)
}
