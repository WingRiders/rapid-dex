import {type Asset, MeshValue} from '@meshsdk/common'
import type {PoolDatum} from '@wingriders/rapid-dex-common'
import BigNumber from 'bignumber.js'
import {getPoolAssetsAndShares, getPoolUnits} from './helpers'

type ComputeNewReservesParams = {
  oldX: BigNumber
  oldY: BigNumber
  lockX: BigNumber
  swapFeePoints: number
  feeBasis: number
}

const computeNewReserves = ({
  oldX,
  oldY,
  lockX,
  swapFeePoints,
  feeBasis,
}: ComputeNewReservesParams) => {
  const swapFee = lockX
    .times(swapFeePoints)
    .div(feeBasis)
    .integerValue(BigNumber.ROUND_CEIL)
  const newX = oldX.plus(lockX)
  const newY = oldY
    .times(oldX)
    .dividedBy(oldX.plus(lockX).minus(swapFee))
    .integerValue(BigNumber.ROUND_CEIL)
  const outY = oldY.minus(newY)
  return {newX, newY, outY}
}

export const calculatePoolAmountAfterSwap = (
  poolDatum: PoolDatum,
  poolAmount: Asset[],
  aToB: boolean,
  lockX: BigNumber,
) => {
  const poolUnits = getPoolUnits(poolDatum)
  const meshValue = MeshValue.fromAssets(poolAmount)
  const {assetA: oldA, assetB: oldB} = getPoolAssetsAndShares(
    poolUnits,
    meshValue,
  )

  const {newX, newY, outY} = computeNewReserves({
    oldX: aToB ? oldA : oldB,
    oldY: aToB ? oldB : oldA,
    lockX,
    swapFeePoints: poolDatum.swapFeePoints,
    feeBasis: poolDatum.feeBasis,
  })

  const [newA, newB] = aToB ? [newX, newY] : [newY, newX]

  meshValue.addAssets([
    {unit: poolUnits.aTokenUnit, quantity: newA.minus(oldA).toString()},
    {unit: poolUnits.bTokenUnit, quantity: newB.minus(oldB).toString()},
  ])
  return {newPoolAmount: meshValue.toAssets(), outY}
}
