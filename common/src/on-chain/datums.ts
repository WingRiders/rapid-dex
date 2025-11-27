import type BigNumber from 'bignumber.js'

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
  treasuryA: BigNumber
  treasuryB: BigNumber
  feeFrom: FeeFrom
  treasuryAuthorityPolicyId: string
  treasuryAuthorityAssetName: string
  treasuryFeePointsAToB: number
  treasuryFeePointsBToA: number
  swapFeePointsAToB: number
  swapFeePointsBToA: number
  feeBasis: number
  sharesAssetName: string
}
