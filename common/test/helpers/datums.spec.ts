import {describe, expect, it} from 'bun:test'
import {FeeFrom} from '../../src'
import {
  poolDatumFromCbor,
  poolDatumFromPoolUtxo,
} from '../../src/helpers/datums'

describe('poolDatumFromCbor', () => {
  it('should parse a valid pool datum', () => {
    const cbor =
      'd8799f4040581c659ab0b5658687c2e74cd10dba8244015b713bf503b90557769d77a74a57696e67526964657273d8799fff0a0a19271058204e05861d714244c9398f61b1aff80bf4c20d6739bf7cb5f410b58a6c914d207eff'
    const result = poolDatumFromCbor(cbor)
    expect(result).toEqual({
      aPolicyId: '',
      aAssetName: '',
      bPolicyId: '659ab0b5658687c2e74cd10dba8244015b713bf503b90557769d77a7',
      bAssetName: '57696e67526964657273',
      feeFrom: FeeFrom.InputToken,
      swapFeePointsAToB: 10,
      swapFeePointsBToA: 10,
      feeBasis: 10000,
      sharesAssetName:
        '4e05861d714244c9398f61b1aff80bf4c20d6739bf7cb5f410b58a6c914d207e',
    })
  })
})

describe('poolDatumFromPoolUtxo', () => {
  it('should extract datum from UTxO', () => {
    const utxo = {
      input: {txHash: 'cafe', outputIndex: 0},
      output: {
        address: '',
        amount: [],
        plutusData:
          'd8799f4040581c659ab0b5658687c2e74cd10dba8244015b713bf503b90557769d77a74a57696e67526964657273d8799fff0a0a19271058204e05861d714244c9398f61b1aff80bf4c20d6739bf7cb5f410b58a6c914d207eff',
      },
    }

    const result = poolDatumFromPoolUtxo(utxo)
    expect(result).toEqual({
      aPolicyId: '',
      aAssetName: '',
      bPolicyId: '659ab0b5658687c2e74cd10dba8244015b713bf503b90557769d77a7',
      bAssetName: '57696e67526964657273',
      feeFrom: FeeFrom.InputToken,
      swapFeePointsAToB: 10,
      swapFeePointsBToA: 10,
      feeBasis: 10000,
      sharesAssetName:
        '4e05861d714244c9398f61b1aff80bf4c20d6739bf7cb5f410b58a6c914d207e',
    })
  })

  it('should throw if plutusData is missing', () => {
    const utxo = {
      input: {txHash: 'cafe', outputIndex: 0},
      output: {address: '', amount: []},
    }
    expect(() => poolDatumFromPoolUtxo(utxo)).toThrow(
      'No inline datum in pool UTxO cafe#0',
    )
  })
})
