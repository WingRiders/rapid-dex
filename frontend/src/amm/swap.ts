import BigNumber from 'bignumber.js'

export type ComputeNewReservesParams = {
  currentX: BigNumber
  currentY: BigNumber
  lockX?: BigNumber
  outY?: BigNumber
  swapFeePoints: number
  feeBasis: number
}

export const computeNewReserves = ({
  currentX,
  currentY,
  lockX,
  outY,
  swapFeePoints,
  feeBasis,
}: ComputeNewReservesParams) => {
  if (lockX && outY)
    throw new Error('Provide only one of lockX or outY, not both.')
  if (!lockX && !outY) throw new Error('Either lockX or outY must be provided.')

  if (!lockX) {
    // Compute lockX from outY
    const feeFactor = new BigNumber(1).minus(
      new BigNumber(swapFeePoints).div(feeBasis),
    )
    const newY = currentY.minus(outY!)
    lockX = currentX
      .times(outY!)
      .div(newY)
      .integerValue(BigNumber.ROUND_CEIL)
      .div(feeFactor)
      .integerValue(BigNumber.ROUND_CEIL)
  }

  const swapFee = lockX
    .times(swapFeePoints)
    .div(feeBasis)
    .integerValue(BigNumber.ROUND_CEIL)
  const newX = currentX.plus(lockX)
  const newY = currentY
    .times(currentX)
    .dividedBy(currentX.plus(lockX).minus(swapFee))
    .integerValue(BigNumber.ROUND_CEIL)
  const computedOutY = currentY.minus(newY)
  if (outY && computedOutY.lt(outY))
    throw new Error(
      `Computed reserves ({lockX: ${lockX}, outY: ${computedOutY.toString()}} do not satisfy given outY (${outY}).`,
    )
  outY = computedOutY
  return {newX, newY, lockX, outY}
}
