import {type Asset, MeshValue} from '@meshsdk/common'
import {type PoolDatum, maxShareTokens} from '@wingriders/rapid-dex-common'
import BigNumber from 'bignumber.js'
import {getPoolAssetsAndShares, getPoolUnits} from './helpers'

type ComputeWithdrawnTokensParams = {
  lockShares: BigNumber
  oldA: BigNumber
  oldB: BigNumber
  oldShares: BigNumber
}

const computeReturnedTokens = ({
  lockShares,
  oldA,
  oldB,
  oldShares,
}: ComputeWithdrawnTokensParams) => {
  const totalEmittedShares = maxShareTokens.minus(oldShares)
  const computeTokenReturn = (oldX: BigNumber) =>
    lockShares
      .multipliedBy(oldX)
      .dividedBy(totalEmittedShares)
      .integerValue(BigNumber.ROUND_FLOOR)

  const returnedA = computeTokenReturn(oldA)
  const returnedB = computeTokenReturn(oldB)
  return {returnedA, returnedB}
}

export const calculatePoolAmountAfterWithdrawLiquidity = (
  poolDatum: PoolDatum,
  poolAmount: Asset[],
  lockShares: BigNumber,
) => {
  const poolUnits = getPoolUnits(poolDatum)
  const meshValue = MeshValue.fromAssets(poolAmount)
  const {
    assetA: oldA,
    assetB: oldB,
    shares: oldShares,
  } = getPoolAssetsAndShares(poolUnits, meshValue)

  const {returnedA, returnedB} = computeReturnedTokens({
    lockShares,
    oldA,
    oldB,
    oldShares,
  })

  meshValue.addAssets([
    {unit: poolUnits.aTokenUnit, quantity: (-returnedA).toString()},
    {unit: poolUnits.bTokenUnit, quantity: (-returnedB).toString()},
    {unit: poolUnits.shareUnit, quantity: lockShares.toString()},
  ])
  return {newPoolAmount: meshValue.toAssets(), returnedA, returnedB}
}
