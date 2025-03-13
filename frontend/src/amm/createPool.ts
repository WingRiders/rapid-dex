import {burnedShareTokens, maxShareTokens} from '@wingriders/rapid-dex-common'
import BigNumber from 'bignumber.js'

export const calculateSharesCreatePool = (
  aQuantity: BigNumber.Value,
  bQuantity: BigNumber.Value,
) => {
  const earned = new BigNumber(aQuantity)
    .multipliedBy(bQuantity)
    .sqrt()
    .integerValue(BigNumber.ROUND_FLOOR)
    .minus(burnedShareTokens)
  const minted = maxShareTokens.minus(burnedShareTokens)
  const pool = minted.minus(earned)
  return {earned, minted, pool}
}
