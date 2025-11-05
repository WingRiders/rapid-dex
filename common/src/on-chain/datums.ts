export enum FeeFrom {
  InputToken = 'InputToken',
  OutputToken = 'OutputToken',
  TokenA = 'TokenA',
  TokenB = 'TokenB',
}

export type PoolDatum = {
  aPolicyId: string
  aAssetName: string
  bPolicyId: string
  bAssetName: string
  feeFrom: FeeFrom
  swapFeePointsAToB: number
  swapFeePointsBToA: number
  feeBasis: number
  sharesAssetName: string
}
