import {describe, expect, it} from 'bun:test'
import {
  type ComputeWithdrawnTokensParams,
  computeReturnedTokens,
} from '@/amm/withdraw-liquidity'
import BigNumber from 'bignumber.js'

describe('computeReturnedTokens', () => {
  const params: ComputeWithdrawnTokensParams = {
    lockShares: new BigNumber(100),
    poolState: {
      qtyA: new BigNumber(1000),
      qtyB: new BigNumber(1000),
      issuedShares: new BigNumber(1000),
    },
  }

  it('should compute returned tokens correctly', () => {
    const {outA, outB} = computeReturnedTokens(params)
    expect(outA.toNumber()).toEqual(100)
    expect(outB.toNumber()).toEqual(100)
  })
})
