import {describe, expect, it} from 'bun:test'
import {type Asset, POLICY_ID_LENGTH} from '@meshsdk/core'
import {sortAssets} from '../../src/helpers/asset'

describe('asset helpers', () => {
  describe('sortAssets', () => {
    const testCases: {
      assetX: Asset
      assetY: Asset
      isSameOrder: boolean
    }[] = [
      {
        assetX: {unit: 'lovelace', quantity: '1'},
        assetY: {unit: `${'a'.repeat(POLICY_ID_LENGTH)}a`, quantity: '1'},
        isSameOrder: true,
      },
      {
        assetX: {unit: `${'a'.repeat(POLICY_ID_LENGTH)}a`, quantity: '1'},
        assetY: {unit: 'lovelace', quantity: '1'},
        isSameOrder: false,
      },
      {
        assetX: {unit: `${'a'.repeat(POLICY_ID_LENGTH)}a`, quantity: '1'},
        assetY: {unit: `${'b'.repeat(POLICY_ID_LENGTH)}b`, quantity: '1'},
        isSameOrder: true,
      },
      {
        assetX: {unit: `${'b'.repeat(POLICY_ID_LENGTH)}b`, quantity: '1'},
        assetY: {unit: `${'a'.repeat(POLICY_ID_LENGTH)}a`, quantity: '1'},
        isSameOrder: false,
      },
    ]

    it.each(testCases)('should sort assets correctly', (testCase) => {
      const result = sortAssets(testCase.assetX, testCase.assetY)
      expect(result).toEqual(
        testCase.isSameOrder
          ? [testCase.assetX, testCase.assetY]
          : [testCase.assetY, testCase.assetX],
      )
    })
  })
})
