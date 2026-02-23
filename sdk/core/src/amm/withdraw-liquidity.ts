import type {
  PoolConfig,
  PoolState,
  WithdrawType,
} from '@wingriders/rapid-dex-common'
import BigNumber from 'bignumber.js'
import {isFeeFromA} from '../helpers'
import {computeNewReserves} from './swap'

export type ComputeWithdrawLiquidityParams = {
  lockShares: BigNumber
  poolState: PoolState
  poolConfig: PoolConfig
  withdrawType: WithdrawType
}

/**
 * @param lockShares The amount of share tokens to withdraw.
 * @param poolState The current state of the pool.
 * @param poolConfig The immutable parameters of the pool.
 * @param withdrawType TO_BOTH = Balanced withdrawal, otherwise it is Zap-Out.
 * @returns The amount of pool tokens that the user will receive when withdrawing the given amount of share tokens from the given pool state.
 */
export const computeWithdrawLiquidity = ({
  lockShares,
  poolState,
  poolConfig,
  withdrawType,
}: ComputeWithdrawLiquidityParams) => {
  if (withdrawType === 'TO_BOTH')
    return computeWithdrawLiquidityBalanced({lockShares, poolState})

  const aRemove = lockShares.times(poolState.qtyA).idiv(poolState.issuedShares)
  const bRemove = lockShares.times(poolState.qtyB).idiv(poolState.issuedShares)
  const aToB = withdrawType === 'TO_B'
  const aPoolInterim = poolState.qtyA.minus(aRemove)
  const bPoolInterim = poolState.qtyB.minus(bRemove)
  const {outY, paidTreasuryFee} = computeNewReserves({
    currentX: aToB ? aPoolInterim : bPoolInterim,
    currentY: aToB ? bPoolInterim : aPoolInterim,
    lockX: aToB ? aRemove : bRemove,
    swapFeePoints: aToB
      ? poolConfig.swapFeePointsAToB
      : poolConfig.swapFeePointsBToA,
    treasuryFeePoints: aToB
      ? poolConfig.treasuryFeePointsAToB
      : poolConfig.treasuryFeePointsBToA,
    feeBasis: poolConfig.feeBasis,
    aToB,
    feeFrom: poolConfig.feeFrom,
  })
  const feeFromA = isFeeFromA(poolConfig.feeFrom, aToB)
  return {
    outA: aToB ? new BigNumber(0) : outY.plus(aRemove),
    outB: aToB ? outY.plus(bRemove) : new BigNumber(0),
    addToTreasuryA: feeFromA ? paidTreasuryFee : new BigNumber(0),
    addToTreasuryB: feeFromA ? new BigNumber(0) : paidTreasuryFee,
  }
}

export const computeWithdrawLiquidityBalanced = ({
  lockShares,
  poolState,
}: Pick<ComputeWithdrawLiquidityParams, 'lockShares' | 'poolState'>) => {
  const computeTokenReturn = (currentX: BigNumber) =>
    lockShares
      .multipliedBy(currentX)
      .dividedBy(poolState.issuedShares)
      .integerValue(BigNumber.ROUND_FLOOR)

  const outA = computeTokenReturn(poolState.qtyA)
  const outB = computeTokenReturn(poolState.qtyB)
  return {
    outA,
    outB,
    addToTreasuryA: new BigNumber(0),
    addToTreasuryB: new BigNumber(0),
  }
}
