import BigNumber from 'bignumber.js'

export const bigintToBigNumber = (value: bigint) =>
  new BigNumber(value.toString())

export const bigNumberToBigInt = (value: BigNumber) => BigInt(value.toString())

export const sumBigNumbers = (bigNumbers: BigNumber[]) =>
  bigNumbers.length > 0 ? BigNumber.sum(...bigNumbers) : new BigNumber(0)

export const compareMaybeBigNumbers = (a?: BigNumber, b?: BigNumber) => {
  if (!a && b) return -1
  if (a && !b) return 1
  return (a ?? new BigNumber(0)).comparedTo(b ?? new BigNumber(0))
}
