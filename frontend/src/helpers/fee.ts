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
