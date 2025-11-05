import {FeeFrom} from '@wingriders/rapid-dex-common'
import BigNumber from 'bignumber.js'

export const computeFee = (feePoints: number, feeBasis: number) =>
  new BigNumber(feePoints).div(feeBasis)

/**
 * @param fee - number between 0 and 1
 */
export const encodeFee = (fee: BigNumber) => {
  const [feePoints, feeBasis] = fee.toFraction()

  return {feePoints: feePoints.toNumber(), feeBasis: feeBasis.toNumber()}
}

export const isFeeFromInput = (feeFrom: FeeFrom, aToB: boolean) =>
  feeFrom === FeeFrom.InputToken ||
  (feeFrom === FeeFrom.TokenA && aToB) ||
  (feeFrom === FeeFrom.TokenB && !aToB)
