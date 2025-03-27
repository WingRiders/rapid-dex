import {describe, expect, it} from 'bun:test'
import BigNumber from 'bignumber.js'
import {encodeFee} from '../../src/helpers/fee'

describe('fee helpers', () => {
  describe('encodeFee', () => {
    const testCases: {
      fee: number
      expectedFeePoints: number
      expectedFeeBasis: number
    }[] = [
      {fee: 0, expectedFeePoints: 0, expectedFeeBasis: 1},
      {fee: 0.1, expectedFeePoints: 1, expectedFeeBasis: 10},
      {fee: 0.01, expectedFeePoints: 1, expectedFeeBasis: 100},
      {fee: 0.02, expectedFeePoints: 1, expectedFeeBasis: 50},
      {fee: 0.0034, expectedFeePoints: 17, expectedFeeBasis: 5000},
      {fee: 0.123456, expectedFeePoints: 1929, expectedFeeBasis: 15625},
      {fee: 0.01002, expectedFeePoints: 501, expectedFeeBasis: 50000},
      {fee: 0.5, expectedFeePoints: 1, expectedFeeBasis: 2},
      {fee: 1, expectedFeePoints: 1, expectedFeeBasis: 1},
    ]
    testCases.forEach(({fee, expectedFeePoints, expectedFeeBasis}) => {
      it(`should return ${expectedFeePoints}/${expectedFeeBasis} for ${fee}`, () => {
        const result = encodeFee(new BigNumber(fee))
        expect(result.feePoints).toBe(expectedFeePoints)
        expect(result.feeBasis).toBe(expectedFeeBasis)
      })
    })
  })
})
