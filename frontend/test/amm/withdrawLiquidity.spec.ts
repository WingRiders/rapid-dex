import {describe, expect, it} from 'bun:test'
import {computeReturnedTokens} from '@/amm/withdrawLiquidity'
import {maxShareTokens} from '@wingriders/rapid-dex-common'
import BigNumber from 'bignumber.js'

describe('computeReturnedTokens', () => {
  const params = {
    lockShares: new BigNumber(100),
    currentA: new BigNumber(1000),
    currentB: new BigNumber(1000),
    currentShares: maxShareTokens.minus(1000),
  }

  it('should compute returned tokens correctly', () => {
    const {outA, outB} = computeReturnedTokens(params)
    expect(outA.toNumber()).toEqual(100)
    expect(outB.toNumber()).toEqual(100)
  })
})
