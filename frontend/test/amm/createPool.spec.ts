import {describe, expect, it} from 'bun:test'
import {computeSharesCreatePool} from '@/amm/createPool'
import BigNumber from 'bignumber.js'

describe('computeSharesCreatePool', () => {
  const params = {
    lockA: new BigNumber(10_000),
    lockB: new BigNumber(10_000),
  }

  it('should compute shares correctly', () => {
    const outShares = computeSharesCreatePool(params)
    expect(outShares.toNumber()).toEqual(9_000) // 10_000 - burnedShareTokens
  })
})
