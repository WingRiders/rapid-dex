import type {MeshValue} from '@meshsdk/common'
import {
  type PoolDatum,
  bigintToBigNumber,
  poolOil,
  poolValidatorHash,
} from '@wingriders/rapid-dex-common'

type PoolUnits = {
  aTokenUnit: string
  bTokenUnit: string
  shareUnit: string
}

export const getPoolUnits = (poolDatum: PoolDatum): PoolUnits => {
  // MeshValue claims to handle '' / 'lovelace' conversion, but with '' it is not able to find the asset
  const aTokenUnit =
    `${poolDatum.aPolicyId}${poolDatum.aAssetName}` || 'lovelace'
  const bTokenUnit = `${poolDatum.bPolicyId}${poolDatum.bAssetName}`
  const shareUnit = `${poolValidatorHash}${poolDatum.sharesAssetName}`
  return {aTokenUnit, bTokenUnit, shareUnit}
}

export const getPoolAssetsAndShares = (
  {aTokenUnit, bTokenUnit, shareUnit: poolShareUnit}: PoolUnits,
  poolAmountValue: MeshValue,
) => {
  const poolAssetA = poolAmountValue.get(aTokenUnit)
  if (!poolAssetA)
    throw new Error(`Pool asset A '${aTokenUnit}' not found in the pool output`)
  const poolAssetB = poolAmountValue.get(bTokenUnit)
  if (!poolAssetB)
    throw new Error(`Pool asset B '${bTokenUnit}' not found in the pool output`)
  const poolSharesAsset = poolAmountValue.get(poolShareUnit)
  if (!poolSharesAsset)
    throw new Error(
      `Pool shares asset '${poolShareUnit}' not found in the pool output`,
    )
  return {
    assetA: bigintToBigNumber(poolAssetA).minus(
      aTokenUnit === 'lovelace' ? poolOil : 0,
    ),
    assetB: bigintToBigNumber(poolAssetB),
    shares: bigintToBigNumber(poolSharesAsset),
  }
}
