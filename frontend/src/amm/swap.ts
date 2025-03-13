import {type Asset, MeshValue} from '@meshsdk/common'
import {type PoolDatum, poolOil} from '@wingriders/rapid-dex-common'
import BigNumber from 'bignumber.js'

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
  const isAdaPool = poolDatum.aPolicyId === '' && poolDatum.aAssetName === ''

  // MeshValue claims to handle '' / 'lovelace' conversion, but with '' it is not able to find the asset
  const aUnit = isAdaPool
    ? 'lovelace'
    : `${poolDatum.aPolicyId}${poolDatum.aAssetName}`
  const bUnit = `${poolDatum.bPolicyId}${poolDatum.bAssetName}`
  const meshValue = MeshValue.fromAssets(poolAmount)
  const poolAssetA = meshValue.get(aUnit)
  if (!poolAssetA)
    throw new Error(`Pool asset A '${aUnit}' not found in the pool output`)
  const poolAssetB = meshValue.get(bUnit)
  if (!poolAssetB)
    throw new Error(`Pool asset B '${bUnit}' not found in the pool output`)
  const oldA = new BigNumber(poolAssetA.toString()).minus(
    isAdaPool ? poolOil : 0,
  )
  const oldB = new BigNumber(poolAssetB.toString())
  const {newX, newY, outY} = computeNewReserves({
    oldX: aToB ? oldA : oldB,
    oldY: aToB ? oldB : oldA,
    lockX,
    swapFeePoints: poolDatum.swapFeePoints,
    feeBasis: poolDatum.feeBasis,
  })

  const [newA, newB] = aToB ? [newX, newY] : [newY, newX]

  meshValue.addAsset({unit: aUnit, quantity: newA.minus(oldA).toString()})
  meshValue.addAsset({unit: bUnit, quantity: newB.minus(oldB).toString()})
  return {newPoolAmount: meshValue.toAssets(), outY}
}
