import {type Data, mConStr, mConStr0} from '@meshsdk/core'
import {FeeFrom, type PoolDatum} from '@wingriders/rapid-dex-common'

const feeFromToMesh = (feeFrom: FeeFrom) =>
  mConStr(
    {
      [FeeFrom.InputToken]: 0,
      [FeeFrom.OutputToken]: 1,
      [FeeFrom.TokenA]: 2,
      [FeeFrom.TokenB]: 3,
    }[feeFrom],
    [],
  )

export const poolDatumToMesh = ({
  aAssetName,
  aPolicyId,
  bAssetName,
  bPolicyId,
  feeBasis,
  sharesAssetName,
  feeFrom,
  swapFeePointsAToB,
  swapFeePointsBToA,
}: PoolDatum): Data =>
  mConStr0([
    aPolicyId,
    aAssetName,
    bPolicyId,
    bAssetName,
    feeFromToMesh(feeFrom),
    swapFeePointsAToB,
    swapFeePointsBToA,
    feeBasis,
    sharesAssetName,
  ])
