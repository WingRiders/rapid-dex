import {burnedShareTokens} from '@wingriders/rapid-dex-common'
import BigNumber from 'bignumber.js'

type ComputeSharesCreatePoolParams = {
  lockA: BigNumber
  lockB: BigNumber
}

export const computeSharesCreatePool = ({
  lockA,
  lockB,
}: ComputeSharesCreatePoolParams) => {
  return lockA
    .multipliedBy(lockB)
    .sqrt()
    .integerValue(BigNumber.ROUND_FLOOR)
    .minus(burnedShareTokens)
}
