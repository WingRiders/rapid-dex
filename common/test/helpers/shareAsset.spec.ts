import {describe, expect, it} from 'bun:test'
import {getShareAssetName} from '../../src'

describe('getShareAssetName', () => {
  it('should return correct asset name for valid input', () => {
    expect(getShareAssetName({txHash: 'cafe', txIndex: 0})).toBe(
      'b8f8268dff586ad369f88af01fb3688da4371244f0edd1a600ba8e5859658332',
    )
    expect(getShareAssetName({txHash: 'cafe', txIndex: 5})).toBe(
      'e61f0958b94ae0c85bf9ced9d9438f35688afac5d8cb30be974400a146fb4948',
    )
    expect(getShareAssetName({txHash: 'cafe', txIndex: 255})).toBe(
      '807f734298b024a5d097bfef50524b445369c8850947a02f92ccbc842d6156ff',
    )
  })

  it('should throw an error if txIndex is greater than 255', () => {
    expect(() =>
      getShareAssetName({txHash: 'cafe', txIndex: 256}),
    ).toThrowError(
      'The output index of the first input (seed) does not fit into a byte: 256',
    )
  })
})
