import {describe, expect, it} from 'bun:test'
import {
  type ComputeWithdrawnTokensParams,
  computeReturnedTokens,
} from '@/amm/withdraw-liquidity'
import BigNumber from 'bignumber.js'

describe('computeReturnedTokens', () => {
  const testCases: {
    params: ComputeWithdrawnTokensParams
    expectedOutA: BigNumber
    expectedOutB: BigNumber
  }[] = [
    {
      params: {
        lockShares: new BigNumber(100),
        poolState: {
          qtyA: new BigNumber(1000),
          qtyB: new BigNumber(1000),
          issuedShares: new BigNumber(1000),
        },
      },
      expectedOutA: new BigNumber(100),
      expectedOutB: new BigNumber(100),
    },
    {
      params: {
        lockShares: new BigNumber(172_487_372),
        poolState: {
          qtyA: new BigNumber(120_000_000),
          qtyB: new BigNumber(991_915_887),
          issuedShares: new BigNumber(344_975_744),
        },
      },
      expectedOutA: new BigNumber(59_999_826),
      expectedOutB: new BigNumber(495_956_505),
    },
  ]

  testCases.forEach(({params, expectedOutA, expectedOutB}) => {
    it('should compute returned tokens correctly', () => {
      const {outA, outB} = computeReturnedTokens(params)
      expect(outA).toEqual(expectedOutA)
      expect(outB).toEqual(expectedOutB)
    })
  })
})
