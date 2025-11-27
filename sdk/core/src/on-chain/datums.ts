import {type Data, mConStr, mConStr0} from '@meshsdk/core'
import {
  bigNumberToBigInt,
  FeeFrom,
  type PoolDatum,
} from '@wingriders/rapid-dex-common'

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
  treasuryA,
  treasuryB,
  feeBasis,
  sharesAssetName,
  feeFrom,
  treasuryAuthorityPolicyId,
  treasuryAuthorityAssetName,
  treasuryFeePointsAToB,
  treasuryFeePointsBToA,
  swapFeePointsAToB,
  swapFeePointsBToA,
}: PoolDatum): Data =>
  mConStr0([
    aPolicyId,
    aAssetName,
    bPolicyId,
    bAssetName,
    bigNumberToBigInt(treasuryA),
    bigNumberToBigInt(treasuryB),
    feeFromToMesh(feeFrom),
    treasuryAuthorityPolicyId,
    treasuryAuthorityAssetName,
    treasuryFeePointsAToB,
    treasuryFeePointsBToA,
    swapFeePointsAToB,
    swapFeePointsBToA,
    feeBasis,
    sharesAssetName,
  ])
