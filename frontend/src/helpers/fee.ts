import BigNumber from 'bignumber.js'

export const computeFee = (feePoints: number, feeBasis: number) =>
  new BigNumber(feePoints).div(feeBasis)
