import BigNumber from 'bignumber.js'

export const bigintToBigNumber = (value: bigint) =>
  new BigNumber(value.toString())
