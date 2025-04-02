import {burnedShareTokens} from '@wingriders/rapid-dex-common'
import BigNumber from 'bignumber.js'

export type ComputeSharesCreatePoolParams = {
  lockX: BigNumber
  lockY: BigNumber
}

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
