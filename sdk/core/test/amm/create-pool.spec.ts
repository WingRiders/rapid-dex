import {describe, expect, it} from 'bun:test'
import BigNumber from 'bignumber.js'
import {
  type ComputeSharesCreatePoolParams,
  computeSharesCreatePool,
} from '../../src/amm/create-pool'

describe('computeSharesCreatePool', () => {
  const testCases: {
    params: ComputeSharesCreatePoolParams
    expectedShares: BigNumber
  }[] = [
    {
      params: {
        lockX: new BigNumber(10_000),
        lockY: new BigNumber(10_000),
      },
      expectedShares: new BigNumber(9_000),
    },
    {
      params: {
        lockX: new BigNumber(20_000),
        lockY: new BigNumber(10_000),
      },
      expectedShares: new BigNumber(13_142),
    },
    {
      params: {
        lockX: new BigNumber(10_000),
        lockY: new BigNumber(20_000),
      },
      expectedShares: new BigNumber(13_142),
    },
    {
      params: {
        lockX: new BigNumber(100_000_000),
        lockY: new BigNumber(1_000_000_000),
      },
      expectedShares: new BigNumber(316_226_766),
    },
  ]

  testCases.forEach(({params, expectedShares}) => {
    it('should compute shares correctly', () => {
      const outShares = computeSharesCreatePool(params)
      expect(outShares).toEqual(expectedShares)
    })
  })
})
