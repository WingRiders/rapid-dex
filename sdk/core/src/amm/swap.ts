import {FeeFrom} from '@wingriders/rapid-dex-common'
import BigNumber from 'bignumber.js'
import {computeFee, isFeeFromInput} from '../helpers/fee'

export type ComputeNewReservesParams = {
  currentX: BigNumber
  currentY: BigNumber
  lockX?: BigNumber
  outY?: BigNumber
  swapFeePoints: number
  feeBasis: number
  aToB: boolean
  feeFrom: FeeFrom
}

export const computeNewReserves = ({
  currentX,
  currentY,
  lockX,
  outY,
  swapFeePoints,
  feeBasis,
  aToB,
  feeFrom,
}: ComputeNewReservesParams) => {
  if (lockX && outY)
    throw new Error('Provide only one of lockX or outY, not both.')
  if (!lockX && !outY) throw new Error('Either lockX or outY must be provided.')

  const swapFee = computeFee(swapFeePoints, feeBasis)

  if (!lockX) {
    // Compute lockX from outY
    const feeFactor = new BigNumber(1).minus(swapFee)
    if (isFeeFromInput(feeFrom, aToB)) {
      // Fee is taken from X
      const newY = currentY.minus(outY!)
      lockX = currentX
        .times(outY!)
        .div(newY)
        .integerValue(BigNumber.ROUND_CEIL)
        .div(feeFactor)
        .integerValue(BigNumber.ROUND_CEIL)
    } else {
      // Fee is taken from Y
      const outYPlusFee = outY!
        .div(feeFactor)
        .integerValue(BigNumber.ROUND_CEIL)
      const newY = currentY.minus(outYPlusFee)
      lockX = currentX
        .times(outYPlusFee)
        .div(newY)
        .integerValue(BigNumber.ROUND_CEIL)
    }
  }

  const newLiquidityParams = {
    currentA: aToB ? currentX : currentY,
    currentB: aToB ? currentY : currentX,
    lockX,
    swapFee,
  }

  const {newA, newB, computedOutY, paidSwapFee} = aToB
    ? [FeeFrom.TokenA, FeeFrom.InputToken].includes(feeFrom)
      ? newLiquidityAToBFeeFromA(newLiquidityParams)
      : newLiquidityAToBFeeFromB(newLiquidityParams)
    : [FeeFrom.TokenA, FeeFrom.OutputToken].includes(feeFrom)
      ? newLiquidityBToAFeeFromA(newLiquidityParams)
      : newLiquidityBToAFeeFromB(newLiquidityParams)
  if (outY && computedOutY.lt(outY))
    throw new Error(
      `Computed reserves ({lockX: ${lockX}, outY: ${computedOutY.toString()}} do not satisfy given outY (${outY}).`,
    )
  outY = computedOutY
  return {
    newX: aToB ? newA : newB,
    newY: aToB ? newB : newA,
    lockX,
    outY,
    paidSwapFee,
  }
}

type NewLiquidityParams = {
  currentA: BigNumber
  currentB: BigNumber
  lockX: BigNumber
  swapFee: BigNumber // Between 0-1
}

const newLiquidityBToAFeeFromA = ({
  currentA,
  currentB,
  swapFee,
  lockX,
}: NewLiquidityParams) => {
  const newB = currentB.plus(lockX)
  const newA = currentB
    .times(currentA)
    .div(newB)
    .integerValue(BigNumber.ROUND_CEIL)
  const receivedPlusFee = currentA.minus(newA)
  const paidSwapFee = receivedPlusFee
    .times(swapFee)
    .integerValue(BigNumber.ROUND_CEIL)
  return {
    newA,
    newB,
    computedOutY: receivedPlusFee.minus(paidSwapFee),
    paidSwapFee,
  }
}

const newLiquidityAToBFeeFromB = ({
  currentA,
  currentB,
  swapFee,
  lockX,
}: NewLiquidityParams) => {
  const newA = currentA.plus(lockX)
  const newB = currentA
    .times(currentB)
    .div(newA)
    .integerValue(BigNumber.ROUND_CEIL)
  const receivedPlusFee = currentB.minus(newB)
  const paidSwapFee = receivedPlusFee
    .times(swapFee)
    .integerValue(BigNumber.ROUND_CEIL)
  return {
    newA,
    newB,
    computedOutY: receivedPlusFee.minus(paidSwapFee),
    paidSwapFee,
  }
}

const newLiquidityAToBFeeFromA = ({
  currentA,
  currentB,
  swapFee,
  lockX,
}: NewLiquidityParams) => {
  const paidSwapFee = lockX.times(swapFee).integerValue(BigNumber.ROUND_CEIL)
  const newA = currentA.plus(lockX)
  const newB = currentA
    .times(currentB)
    .div(newA.minus(paidSwapFee))
    .integerValue(BigNumber.ROUND_CEIL)
  return {newA, newB, computedOutY: currentB.minus(newB), paidSwapFee}
}

const newLiquidityBToAFeeFromB = ({
  currentA,
  currentB,
  swapFee,
  lockX,
}: NewLiquidityParams) => {
  const paidSwapFee = lockX.times(swapFee).integerValue(BigNumber.ROUND_CEIL)
  const newB = currentB.plus(lockX)
  const newA = currentA
    .times(currentB)
    .div(newB.minus(paidSwapFee))
    .integerValue(BigNumber.ROUND_CEIL)
  return {newA, newB, computedOutY: currentA.minus(newA), paidSwapFee}
}
