import {type Data, mConStr0} from '@meshsdk/core'
import type {PoolDatum} from '@wingriders/rapid-dex-common'

export const poolDatumToMesh = ({
  aAssetName,
  aPolicyId,
  bAssetName,
  bPolicyId,
  feeBasis,
  sharesAssetName,
  swapFeePoints,
}: PoolDatum): Data =>
  mConStr0([
    aPolicyId,
    aAssetName,
    bPolicyId,
    bAssetName,
    swapFeePoints,
    feeBasis,
    sharesAssetName,
  ])
