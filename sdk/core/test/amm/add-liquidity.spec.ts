import {describe, expect, it} from 'bun:test'
import BigNumber from 'bignumber.js'
import {
  type ComputeEarnedSharesParams,
  computeEarnedShares,
} from '../../src/amm/add-liquidity'

describe('computeEarnedShares', () => {
  const testCases: {
    params: ComputeEarnedSharesParams
    expectedEarnedShares: BigNumber
  }[] = [
    {
      params: {
        lockA: new BigNumber(100),
        lockB: new BigNumber(100),
        poolState: {
          qtyA: new BigNumber(1000),
          qtyB: new BigNumber(1000),
          issuedShares: new BigNumber(1000),
        },
      },
      expectedEarnedShares: new BigNumber(100),
    },
    {
      params: {
        lockA: new BigNumber(10_000_000),
        lockB: new BigNumber(82_659_658),
        poolState: {
          qtyA: new BigNumber(110_000_000),
          qtyB: new BigNumber(909_256_229),
          issuedShares: new BigNumber(316_227_766),
        },
      },
      expectedEarnedShares: new BigNumber(28_747_978),
    },
  ]

  testCases.forEach(({params, expectedEarnedShares}) => {
    it('should compute earned shares correctly', () => {
      const result = computeEarnedShares(params)
      expect(result).toEqual(expectedEarnedShares)
    })
  })
})
