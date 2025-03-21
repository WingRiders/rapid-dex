import {computeFee} from '@/helpers/fee'
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

  const swapFee = computeFee(swapFeePoints, feeBasis)

  if (!lockX) {
    // Compute lockX from outY
    const feeFactor = new BigNumber(1).minus(swapFee)
    const newY = currentY.minus(outY!)
    lockX = currentX
      .times(outY!)
      .div(newY)
      .integerValue(BigNumber.ROUND_CEIL)
      .div(feeFactor)
      .integerValue(BigNumber.ROUND_CEIL)
  }

  const paidSwapFee = lockX.times(swapFee).integerValue(BigNumber.ROUND_CEIL)
  const newX = currentX.plus(lockX)
  const newY = currentY
    .times(currentX)
    .dividedBy(currentX.plus(lockX).minus(paidSwapFee))
    .integerValue(BigNumber.ROUND_CEIL)
  const computedOutY = currentY.minus(newY)
  if (outY && computedOutY.lt(outY))
    throw new Error(
      `Computed reserves ({lockX: ${lockX}, outY: ${computedOutY.toString()}} do not satisfy given outY (${outY}).`,
    )
  outY = computedOutY
  return {newX, newY, lockX, outY, paidSwapFee}
}
