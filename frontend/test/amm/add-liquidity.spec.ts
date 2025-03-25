import {describe, expect, it} from 'bun:test'
import {
  type ComputeEarnedSharesParams,
  computeEarnedShares,
} from '@/amm/add-liquidity'
import BigNumber from 'bignumber.js'

describe('computeEarnedShares', () => {
  const params: ComputeEarnedSharesParams = {
    lockA: new BigNumber(100),
    lockB: new BigNumber(100),
    poolState: {
      qtyA: new BigNumber(1000),
      qtyB: new BigNumber(1000),
      issuedShares: new BigNumber(1000),
    },
  }

  it('should compute earned shares correctly', () => {
    const result = computeEarnedShares(params)
    expect(result.toNumber()).toEqual(100)
  })
})
