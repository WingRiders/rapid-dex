import BigNumber from 'bignumber.js'

export const compareMaybeBigNumbers = (a?: BigNumber, b?: BigNumber) => {
  if (!a && b) return 1
  if (a && !b) return -1
  return (a ?? new BigNumber(0)).comparedTo(b ?? new BigNumber(0))
}
