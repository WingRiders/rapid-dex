import {describe, expect, it} from 'bun:test'
import {computeEarnedShares} from '@/amm/addLiquidity'
import {maxShareTokens} from '@wingriders/rapid-dex-common'
import BigNumber from 'bignumber.js'

describe('computeEarnedShares', () => {
  const params = {
    lockA: new BigNumber(100),
    lockB: new BigNumber(100),
    currentA: new BigNumber(1000),
    currentB: new BigNumber(1000),
    currentShares: maxShareTokens.minus(1000),
  }

  it('should compute earned shares correctly', () => {
    const result = computeEarnedShares(params)
    expect(result.toNumber()).toEqual(100)
  })
})
