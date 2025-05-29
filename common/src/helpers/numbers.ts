import BigNumber from 'bignumber.js'

export const bigintToBigNumber = (value: bigint) =>
  new BigNumber(value.toString())

export const bigNumberToBigInt = (value: BigNumber) => BigInt(value.toString())
