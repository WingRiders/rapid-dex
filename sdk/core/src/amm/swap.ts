import {FeeFrom} from '@wingriders/rapid-dex-common'
import BigNumber from 'bignumber.js'
import {computeFee, isFeeFromInput} from '../helpers/fee'

export type ComputeNewReservesParams = {
  currentX: BigNumber
  currentY: BigNumber
  lockX?: BigNumber
  outY?: BigNumber
  swapFeePoints: number
  treasuryFeePoints: number
  feeBasis: number
  aToB: boolean
  feeFrom: FeeFrom
}

/**
 * @param currentX The current amount of token X in the pool.
 * @param currentY The current amount of token Y in the pool.
 * @param lockX The amount of token X to be sold (if defined, @param outY must be undefined).
 * @param outY The amount of token Y to be bought (if defined, @param lockX must be undefined).
 * @param swapFeePoints The swap fee points.
 * @param feeBasis The fee basis.
 * @param aToB Whether the swap is from token A to token B.
 * @param feeFrom Which token the fee is taken from.
 * @returns The new pool reserves after the swap.
 */
export const computeNewReserves = ({
  currentX,
  currentY,
  lockX,
  outY,
  swapFeePoints,
  treasuryFeePoints,
  feeBasis,
  aToB,
  feeFrom,
}: ComputeNewReservesParams) => {
  if (lockX && outY)
    throw new Error('Provide only one of lockX or outY, not both.')
  if (!lockX && !outY) throw new Error('Either lockX or outY must be provided.')

  const swapFee = computeFee(swapFeePoints, feeBasis)
  const treasuryFee = computeFee(treasuryFeePoints, feeBasis)

  if (!lockX) {
    // Compute lockX from outY
    const feeFactor = new BigNumber(1).minus(swapFee).minus(treasuryFee)
    if (feeFactor.lte(0)) {
      throw new Error(
        `Could not compute lockX: feeFactor <= 0: ${feeFactor.toString()}`,
      )
    }

    if (isFeeFromInput(feeFrom, aToB)) {
      // Fee is taken from X
      const newY = currentY.minus(outY!)
      const lockXMinusFees = currentX
        .times(outY!)
        .div(newY)
        .integerValue(BigNumber.ROUND_CEIL)

      // Piece-wise rounding may make lockX be max +2 bigger
      const minPossibleLockX = lockXMinusFees
        .div(feeFactor)
        .integerValue(BigNumber.ROUND_CEIL)
      const maxPossibleLockX = minPossibleLockX.plus(2)

      const computeLockX = () => {
        for (
          let lockX = minPossibleLockX;
          lockX.lte(maxPossibleLockX);
          lockX = lockX.plus(1)
        ) {
          const paidSwapFee = lockX
            .times(swapFee)
            .integerValue(BigNumber.ROUND_CEIL)
          const paidTreasuryFee = lockX
            .times(treasuryFee)
            .integerValue(BigNumber.ROUND_CEIL)
          const newX = currentX.plus(lockX).minus(paidTreasuryFee)
          const computedNewY = currentX
            .times(currentY)
            .div(newX.minus(paidSwapFee))
            .integerValue(BigNumber.ROUND_CEIL)
          const computedOutY = currentY.minus(computedNewY)
          if (computedOutY.gte(outY!)) {
            return lockX
          }
        }
        throw new Error(
          `Could not compute lockX - should not happen (outY: ${outY!}, swapFee: ${swapFee}, treasuryFee: ${treasuryFee}, minPossibleLockX: ${minPossibleLockX}, maxPossibleLockX: ${maxPossibleLockX}, feeFrom: ${feeFrom}, aToB: ${aToB}, currentX: ${currentX}, currentY: ${currentY})`,
        )
      }

      lockX = computeLockX()
    } else {
      // Fee is taken from Y

      // Piece-wise rounding may make outYPlusFees be max +2 bigger
      const minPossibleOutYPlusFees = outY!
        .div(feeFactor)
        .integerValue(BigNumber.ROUND_CEIL)
      const maxPossibleNewY = currentY.minus(minPossibleOutYPlusFees)
      const minPossibleNewY = BigNumber.max(maxPossibleNewY.minus(2), 1)
      const minPossibleNewX = currentX
        .times(currentY)
        .div(maxPossibleNewY)
        .integerValue(BigNumber.ROUND_CEIL)
      const maxPossibleNewX = currentX
        .times(currentY)
        .div(minPossibleNewY)
        .integerValue(BigNumber.ROUND_CEIL)
      const minPossibleLockX = minPossibleNewX.minus(currentX)
      const maxPossibleLockX = maxPossibleNewX.minus(currentX)

      const computeLockX = () => {
        for (
          let lockX = minPossibleLockX;
          lockX.lte(maxPossibleLockX);
          lockX = lockX.plus(1)
        ) {
          const newX = currentX.plus(lockX)
          const newY = currentX
            .times(currentY)
            .div(newX)
            .integerValue(BigNumber.ROUND_CEIL)
          const outYPlusFee = currentY.minus(newY)
          const paidSwapFee = outYPlusFee
            .times(swapFee)
            .integerValue(BigNumber.ROUND_CEIL)
          const paidTreasuryFee = outYPlusFee
            .times(treasuryFee)
            .integerValue(BigNumber.ROUND_CEIL)
          const computedOutY = outYPlusFee
            .minus(paidSwapFee)
            .minus(paidTreasuryFee)
          if (computedOutY.gte(outY!)) {
            return lockX
          }
        }
        throw new Error(
          `Could not compute lockX - should not happen (outY: ${outY!}, swapFee: ${swapFee}, treasuryFee: ${treasuryFee}, minPossibleOutYPlusFees: ${minPossibleOutYPlusFees}, maxPossibleNewY: ${maxPossibleNewY}, minPossibleNewY: ${minPossibleNewY}, minPossibleLockX: ${minPossibleLockX}, maxPossibleLockX: ${maxPossibleLockX.plus(2)}, feeFrom: ${feeFrom}, aToB: ${aToB}, currentX: ${currentX}, currentY: ${currentY})`,
        )
      }

      lockX = computeLockX()
    }
  }

  const newLiquidityParams = {
    currentA: aToB ? currentX : currentY,
    currentB: aToB ? currentY : currentX,
    lockX,
    swapFee,
    treasuryFee,
  }

  const {newA, newB, computedOutY, paidSwapFee, paidTreasuryFee} = aToB
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
    paidTreasuryFee,
  }
}

type NewLiquidityParams = {
  currentA: BigNumber
  currentB: BigNumber
  lockX: BigNumber
  swapFee: BigNumber // Between 0-1
  treasuryFee: BigNumber // Between 0-1
}

const newLiquidityBToAFeeFromA = ({
  currentA,
  currentB,
  swapFee,
  treasuryFee,
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
  const paidTreasuryFee = receivedPlusFee
    .times(treasuryFee)
    .integerValue(BigNumber.ROUND_CEIL)
  return {
    newA,
    newB,
    computedOutY: receivedPlusFee.minus(paidSwapFee).minus(paidTreasuryFee),
    paidSwapFee,
    paidTreasuryFee,
  }
}

const newLiquidityAToBFeeFromB = ({
  currentA,
  currentB,
  swapFee,
  treasuryFee,
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
  const paidTreasuryFee = receivedPlusFee
    .times(treasuryFee)
    .integerValue(BigNumber.ROUND_CEIL)
  return {
    newA,
    newB,
    computedOutY: receivedPlusFee.minus(paidSwapFee).minus(paidTreasuryFee),
    paidSwapFee,
    paidTreasuryFee,
  }
}

const newLiquidityAToBFeeFromA = ({
  currentA,
  currentB,
  swapFee,
  treasuryFee,
  lockX,
}: NewLiquidityParams) => {
  const paidSwapFee = lockX.times(swapFee).integerValue(BigNumber.ROUND_CEIL)
  const paidTreasuryFee = lockX
    .times(treasuryFee)
    .integerValue(BigNumber.ROUND_CEIL)
  const newA = currentA.plus(lockX).minus(paidTreasuryFee)
  const newB = currentA
    .times(currentB)
    .div(newA.minus(paidSwapFee))
    .integerValue(BigNumber.ROUND_CEIL)
  return {
    newA,
    newB,
    computedOutY: currentB.minus(newB),
    paidSwapFee,
    paidTreasuryFee,
  }
}

const newLiquidityBToAFeeFromB = ({
  currentA,
  currentB,
  swapFee,
  treasuryFee,
  lockX,
}: NewLiquidityParams) => {
  const paidSwapFee = lockX.times(swapFee).integerValue(BigNumber.ROUND_CEIL)
  const paidTreasuryFee = lockX
    .times(treasuryFee)
    .integerValue(BigNumber.ROUND_CEIL)
  const newB = currentB.plus(lockX).minus(paidTreasuryFee)
  const newA = currentA
    .times(currentB)
    .div(newB.minus(paidSwapFee))
    .integerValue(BigNumber.ROUND_CEIL)
  return {
    newA,
    newB,
    computedOutY: currentA.minus(newA),
    paidSwapFee,
    paidTreasuryFee,
  }
}
