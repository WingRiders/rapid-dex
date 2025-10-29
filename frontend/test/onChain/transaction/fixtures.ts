import {mock} from 'bun:test'
import type {IWallet, UTxO} from '@meshsdk/core'
import {
  burnedShareTokens,
  createUnit,
  LOVELACE_UNIT,
  maxShareTokens,
  poolScriptAddressByNetwork,
  poolValidatorHash,
  poolValidityAssetNameHex,
} from '@wingriders/rapid-dex-common'
import {BigNumber} from 'bignumber.js'
import type {PoolInteractionTxPool} from '@/on-chain/transaction/types'
import {mockWallet as commonMockWallet} from '../../common'

export const mockWallet: IWallet = {
  ...commonMockWallet,
  getChangeAddress: mock(() => Promise.resolve(address)),
}

export const mockWalletUtxos = (utxos: UTxO[]) => {
  mockWallet.getUtxos = mock(() => Promise.resolve(utxos))
}

export const address =
  'addr_test1qz2fxv2umyhttkxyxp8x0dlpdt3k6cwng5pxj3jhsydzer3n0d3vllmyqwsx5wktcd8cc3sq835lu7drv2xwl2wywfgs68faae'

export const collateralUtxo = {
  input: {
    txHash: 'cafecafecafecafecafecafecafecafecafecafecafecafecafecafecafecafe',
    outputIndex: 0,
  },
  output: {
    amount: [{unit: LOVELACE_UNIT, quantity: '5000000'}],
    address,
  },
}

export const assetA = {
  unit: 'beefbeefbeefbeefbeefbeefbeefbeefbeefbeefbeefbeefbeefbeef',
  quantity: '10000',
}

export const assetB = {
  unit: 'deaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddead',
  quantity: '10000',
}

export const seedUtxo = {
  input: {
    txHash: 'cafecafecafecafecafecafecafecafecafecafecafecafecafecafecafecafe',
    outputIndex: 1,
  },
  output: {
    amount: [{unit: LOVELACE_UNIT, quantity: '8000000'}, assetA, assetB],
    address,
  },
}

export const userAdaOnlyUtxo = {
  input: {
    txHash: 'cafecafecafecafecafecafecafecafecafecafecafecafecafecafecafecafe',
    outputIndex: 1,
  },
  output: {
    amount: [{unit: LOVELACE_UNIT, quantity: '20000000'}],
    address,
  },
}

export const userAdaAndWrtUtxo = {
  input: {
    txHash: 'cafecafecafecafecafecafecafecafecafecafecafecafecafecafecafecafe',
    outputIndex: 3,
  },
  output: {
    amount: [
      {unit: LOVELACE_UNIT, quantity: '20000000'},
      {
        unit: '659ab0b5658687c2e74cd10dba8244015b713bf503b90557769d77a757696e67526964657273',
        quantity: '20000000',
      },
    ],
    address,
  },
}

export const userSharesUtxo = {
  input: {
    txHash: 'cafecafecafecafecafecafecafecafecafecafecafecafecafecafecafecafe',
    outputIndex: 4,
  },
  output: {
    amount: [
      {unit: LOVELACE_UNIT, quantity: '20000000'},
      {
        unit: `${poolValidatorHash}4e05861d714244c9398f61b1aff80bf4c20d6739bf7cb5f410b58a6c914d207e`,
        quantity: '20000000',
      },
    ],
    address,
  },
}

export const pool: PoolInteractionTxPool = {
  unitA: LOVELACE_UNIT,
  unitB:
    '659ab0b5658687c2e74cd10dba8244015b713bf503b90557769d77a757696e67526964657273',
  shareAssetName:
    '4e05861d714244c9398f61b1aff80bf4c20d6739bf7cb5f410b58a6c914d207e',
  poolState: {
    qtyA: new BigNumber(18_000_000),
    qtyB: new BigNumber(20_000_000),
    issuedShares: new BigNumber(20_000_000),
  },
  utxo: {
    input: {
      txHash:
        'cafecafecafecafecafecafecafecafecafecafecafecafecafecafecafecafe',
      outputIndex: 2,
    },
    output: {
      address: poolScriptAddressByNetwork.preprod,
      amount: [
        {unit: LOVELACE_UNIT, quantity: '20000000'},
        {
          unit: '659ab0b5658687c2e74cd10dba8244015b713bf503b90557769d77a757696e67526964657273',
          quantity: '20000000',
        },
        {
          unit: `${poolValidatorHash}4e05861d714244c9398f61b1aff80bf4c20d6739bf7cb5f410b58a6c914d207e`,
          quantity: maxShareTokens
            .minus(burnedShareTokens)
            .minus(20_000_000)
            .toString(),
        },
        {
          unit: createUnit(poolValidatorHash, poolValidityAssetNameHex),
          quantity: '1',
        },
      ],
      plutusData:
        'd8799f4040581c659ab0b5658687c2e74cd10dba8244015b713bf503b90557769d77a74a57696e675269646572730a19271058204e05861d714244c9398f61b1aff80bf4c20d6739bf7cb5f410b58a6c914d207eff',
    },
  },
}
