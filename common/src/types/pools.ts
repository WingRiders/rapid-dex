import type BigNumber from 'bignumber.js'

export type PoolState = {
  qtyA: BigNumber
  qtyB: BigNumber
  issuedShares: BigNumber
}
