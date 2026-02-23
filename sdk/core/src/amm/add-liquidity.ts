import type {PoolConfig, PoolState} from '@wingriders/rapid-dex-common'
import BigNumber from 'bignumber.js'
import {isFeeFromInput} from '../helpers'
import {computeNewReserves} from './swap'

export type ComputeAddLiquidityParams = {
  lockA: BigNumber
  lockB: BigNumber
  poolState: PoolState
  poolConfig: PoolConfig
}

/**
 * @param lockA The amount of token A to add to the pool.
 * @param lockB The amount of token B to add to the pool.
 * @param poolState The current state of the pool.
 * @param poolConfig The immutable parameters of the pool.
 * @returns {
 *   earnedShares: The number of share tokens that the user will receive when adding the given liquidity amount into the given pool state.
 *   xSwap: For Zap-In, it's the swap amount. Otherwise, zero.
 *   addToTreasuryA: For Zap-In, it's the amount added to treasuryA because of treasury fees for swap. Otherwise, zero.
 *   addToTreasuryB: For Zap-In, it's the amount added to treasuryB because of treasury fees for swap. Otherwise, zero.
 * }
 */
export const computeAddLiquidity = ({
  lockA,
  lockB,
  poolState,
  poolConfig,
}: ComputeAddLiquidityParams) => {
  if (lockA.isZero()) {
    // Zap-In with B, swap some B to get A
    const {earnedShares, xSwap, paidTreasuryFee} = computeZapInB({
      lockB,
      poolState,
      poolConfig,
    })
    const isFeeFromB = isFeeFromInput(poolConfig.feeFrom, false)
    return {
      earnedShares,
      xSwap,
      addToTreasuryA: isFeeFromB ? new BigNumber(0) : paidTreasuryFee,
      addToTreasuryB: isFeeFromB ? paidTreasuryFee : new BigNumber(0),
    }
  }
  if (lockB.isZero()) {
    // Zap-In with A, swap some A to get B
    const {earnedShares, xSwap, paidTreasuryFee} = computeZapInA({
      lockA,
      poolState,
      poolConfig,
    })
    const isFeeFromA = isFeeFromInput(poolConfig.feeFrom, true)
    return {
      earnedShares,
      xSwap,
      addToTreasuryA: isFeeFromA ? paidTreasuryFee : new BigNumber(0),
      addToTreasuryB: isFeeFromA ? new BigNumber(0) : paidTreasuryFee,
    }
  }
  // Balanced Add Liquidity
  return computeBalancedAddLiquidity({lockA, lockB, poolState, poolConfig})
}

const computeBalancedAddLiquidity = ({
  lockA,
  lockB,
  poolState,
}: ComputeAddLiquidityParams) => {
  const computeEarnedSharesFromOneToken = (
    lockX: BigNumber,
    currentX: BigNumber,
  ) =>
    lockX
      .multipliedBy(poolState.issuedShares)
      .dividedBy(currentX)
      .integerValue(BigNumber.ROUND_FLOOR)
  const earnedSharesFromA = computeEarnedSharesFromOneToken(
    lockA,
    poolState.qtyA,
  )
  const earnedSharesFromB = computeEarnedSharesFromOneToken(
    lockB,
    poolState.qtyB,
  )
  return {
    earnedShares: BigNumber.min(earnedSharesFromA, earnedSharesFromB),
    xSwap: new BigNumber(0),
    addToTreasuryA: new BigNumber(0),
    addToTreasuryB: new BigNumber(0),
  }
}

type ComputeZapInBParams = {
  lockB: BigNumber
  poolState: PoolState
  poolConfig: PoolConfig
}

const computeZapInB = ({lockB, poolState, poolConfig}: ComputeZapInBParams) => {
  let minSwap = new BigNumber(1)
  let maxSwap = lockB.minus(1)
  while (minSwap.lte(maxSwap)) {
    const xSwap = minSwap.plus(maxSwap).idiv(2)
    const checkZapInResult = checkZapInB({lockB, xSwap, poolState, poolConfig})
    switch (checkZapInResult.result) {
      case 'ok':
        return {
          xSwap,
          earnedShares: checkZapInResult.earnedShares,
          paidTreasuryFee: checkZapInResult.paidTreasuryFee,
        }
      case 'swapLess': {
        maxSwap = xSwap.minus(1)
        break
      }
      case 'swapMore': {
        minSwap = xSwap.plus(1)
        break
      }
    }
  }
  throw new Error(
    `Could not calculate Zap-In: lockB = ${lockB}, poolState.qtyA = ${poolState.qtyA}, poolState.qtyB = ${poolState.qtyB}`,
  )
}

type CheckZapInBParams = {
  lockB: BigNumber
  xSwap: BigNumber
  poolState: PoolState
  poolConfig: PoolConfig
}

type CheckZapInResult =
  | {result: 'ok'; earnedShares: BigNumber; paidTreasuryFee: BigNumber}
  | {result: 'swapMore' | 'swapLess'}

const checkZapInB = ({
  lockB,
  xSwap,
  poolState,
  poolConfig,
}: CheckZapInBParams): CheckZapInResult => {
  const {
    newX: bPoolInterim,
    newY: aPoolInterim,
    outY: aReceived,
    paidTreasuryFee,
  } = computeNewReserves({
    currentX: poolState.qtyB,
    currentY: poolState.qtyA,
    lockX: xSwap,
    swapFeePoints: poolConfig.swapFeePointsBToA,
    treasuryFeePoints: poolConfig.treasuryFeePointsBToA,
    feeBasis: poolConfig.feeBasis,
    aToB: false,
    feeFrom: poolConfig.feeFrom,
  })
  const bAddLiquidity = lockB.minus(xSwap)
  const sharesEarnedFromA = aReceived
    .times(poolState.issuedShares)
    .idiv(aPoolInterim)
  const sharesEarnedFromB = bAddLiquidity
    .times(poolState.issuedShares)
    .idiv(bPoolInterim)

  const {
    newX: bPoolInterim1,
    newY: aPoolInterim1,
    outY: aReceived1,
  } = computeNewReserves({
    currentX: poolState.qtyB,
    currentY: poolState.qtyA,
    lockX: xSwap.minus(1),
    swapFeePoints: poolConfig.swapFeePointsBToA,
    treasuryFeePoints: poolConfig.treasuryFeePointsBToA,
    feeBasis: poolConfig.feeBasis,
    aToB: false,
    feeFrom: poolConfig.feeFrom,
  })
  const bAddLiquidity1 = lockB.minus(xSwap.minus(1))
  const sharesEarnedFromA1 = aReceived1
    .times(poolState.issuedShares)
    .idiv(aPoolInterim1)
  const sharesEarnedFromB1 = bAddLiquidity1
    .times(poolState.issuedShares)
    .idiv(bPoolInterim1)

  if (sharesEarnedFromB.gt(sharesEarnedFromA)) {
    return {result: 'swapMore'}
  }
  if (sharesEarnedFromB1.lte(sharesEarnedFromA1)) {
    return {result: 'swapLess'}
  }
  return {
    result: 'ok',
    earnedShares: BigNumber.min(sharesEarnedFromA, sharesEarnedFromB),
    paidTreasuryFee,
  }
}

type ComputeZapInAParams = {
  lockA: BigNumber
  poolState: PoolState
  poolConfig: PoolConfig
}

const computeZapInA = ({lockA, poolState, poolConfig}: ComputeZapInAParams) => {
  let minSwap = new BigNumber(1)
  let maxSwap = lockA.minus(1)
  while (minSwap.lte(maxSwap)) {
    const xSwap = minSwap.plus(maxSwap).idiv(2)
    const checkZapInResult = checkZapInA({lockA, xSwap, poolState, poolConfig})
    switch (checkZapInResult.result) {
      case 'ok':
        return {
          xSwap,
          earnedShares: checkZapInResult.earnedShares,
          paidTreasuryFee: checkZapInResult.paidTreasuryFee,
        }
      case 'swapLess': {
        maxSwap = xSwap.minus(1)
        break
      }
      case 'swapMore': {
        minSwap = xSwap.plus(1)
        break
      }
    }
  }
  throw new Error(
    `Could not calculate Zap-In: lockA = ${lockA}, poolState.qtyA = ${poolState.qtyA}, poolState.qtyB = ${poolState.qtyB}`,
  )
}

type CheckZapInAParams = {
  lockA: BigNumber
  xSwap: BigNumber
  poolState: PoolState
  poolConfig: PoolConfig
}

const checkZapInA = ({
  lockA,
  xSwap,
  poolState,
  poolConfig,
}: CheckZapInAParams): CheckZapInResult => {
  const {
    newX: aPoolInterim,
    newY: bPoolInterim,
    outY: bReceived,
    paidTreasuryFee,
  } = computeNewReserves({
    currentX: poolState.qtyA,
    currentY: poolState.qtyB,
    lockX: xSwap,
    swapFeePoints: poolConfig.swapFeePointsAToB,
    treasuryFeePoints: poolConfig.treasuryFeePointsAToB,
    feeBasis: poolConfig.feeBasis,
    aToB: true,
    feeFrom: poolConfig.feeFrom,
  })
  const aAddLiquidity = lockA.minus(xSwap)
  const sharesEarnedFromA = aAddLiquidity
    .times(poolState.issuedShares)
    .idiv(aPoolInterim)
  const sharesEarnedFromB = bReceived
    .times(poolState.issuedShares)
    .idiv(bPoolInterim)

  const {
    newX: aPoolInterim1,
    newY: bPoolInterim1,
    outY: bReceived1,
  } = computeNewReserves({
    currentX: poolState.qtyA,
    currentY: poolState.qtyB,
    lockX: xSwap.minus(1),
    swapFeePoints: poolConfig.swapFeePointsAToB,
    treasuryFeePoints: poolConfig.treasuryFeePointsAToB,
    feeBasis: poolConfig.feeBasis,
    aToB: true,
    feeFrom: poolConfig.feeFrom,
  })
  const aAddLiquidity1 = lockA.minus(xSwap.minus(1))
  const sharesEarnedFromA1 = aAddLiquidity1
    .times(poolState.issuedShares)
    .idiv(aPoolInterim1)
  const sharesEarnedFromB1 = bReceived1
    .times(poolState.issuedShares)
    .idiv(bPoolInterim1)

  if (sharesEarnedFromA.gt(sharesEarnedFromB)) {
    return {result: 'swapMore'}
  }
  if (sharesEarnedFromA1.lte(sharesEarnedFromB1)) {
    return {result: 'swapLess'}
  }
  return {
    result: 'ok',
    earnedShares: BigNumber.min(sharesEarnedFromA, sharesEarnedFromB),
    paidTreasuryFee,
  }
}
