import {type Asset, MeshValue} from '@meshsdk/common'
import {type PoolDatum, maxShareTokens} from '@wingriders/rapid-dex-common'
import BigNumber from 'bignumber.js'
import {getPoolAssetsAndShares, getPoolUnits} from './helpers'

type ComputeEarnedSharesParams = {
  lockA: BigNumber
  lockB: BigNumber
  oldA: BigNumber
  oldB: BigNumber
  oldShares: BigNumber
}

const computeEarnedShares = ({
  lockA,
  lockB,
  oldA,
  oldB,
  oldShares,
}: ComputeEarnedSharesParams) => {
  const totalEmittedShares = maxShareTokens.minus(oldShares)
  const computeEarnedSharesFromOneToken = (lockX: BigNumber, oldX: BigNumber) =>
    lockX
      .multipliedBy(totalEmittedShares)
      .dividedBy(oldX)
      .integerValue(BigNumber.ROUND_FLOOR)
  const earnedSharesFromA = computeEarnedSharesFromOneToken(lockA, oldA)
  const earnedSharesFromB = computeEarnedSharesFromOneToken(lockB, oldB)
  const earnedShares = BigNumber.min(earnedSharesFromA, earnedSharesFromB)
  return earnedShares
}

export const calculatePoolAmountAfterAddLiquidity = (
  poolDatum: PoolDatum,
  poolAmount: Asset[],
  lockA: BigNumber,
  lockB: BigNumber,
) => {
  const poolUnits = getPoolUnits(poolDatum)
  const meshValue = MeshValue.fromAssets(poolAmount)
  const {
    assetA: oldA,
    assetB: oldB,
    shares: oldShares,
  } = getPoolAssetsAndShares(poolUnits, meshValue)

  const earnedShares = computeEarnedShares({
    lockA,
    lockB,
    oldA,
    oldB,
    oldShares,
  })

  meshValue.addAssets([
    {unit: poolUnits.aTokenUnit, quantity: lockA.toString()},
    {unit: poolUnits.bTokenUnit, quantity: lockB.toString()},
    {unit: poolUnits.shareUnit, quantity: (-earnedShares).toString()},
  ])
  return {newPoolAmount: meshValue.toAssets(), earnedShares}
}
