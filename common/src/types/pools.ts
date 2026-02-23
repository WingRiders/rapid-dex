import type BigNumber from 'bignumber.js'
import type {FeeFrom} from '../on-chain'

export type PoolState = {
  qtyA: BigNumber
  qtyB: BigNumber
  issuedShares: BigNumber
  treasuryA: BigNumber
  treasuryB: BigNumber
}

export type PoolConfig = {
  swapFeePointsAToB: number
  swapFeePointsBToA: number
  treasuryFeePointsAToB: number
  treasuryFeePointsBToA: number
  feeBasis: number
  feeFrom: FeeFrom
}
