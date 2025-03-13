import {mock} from 'bun:test'
import type {IWallet} from '@meshsdk/common'

export const mockWallet: IWallet = {
  getAssets: mock(),
  getBalance: mock(),
  getExtensions: mock(),
  getUsedAddresses: mock(),
  getLovelace: mock(),
  getNetworkId: mock(),
  getRewardAddresses: mock(),
  getDRep: mock(),
  getUnusedAddresses: mock(),
  getPolicyIdAssets: mock(),
  getPolicyIds: mock(),
  getRegisteredPubStakeKeys: mock(),
  getUnregisteredPubStakeKeys: mock(),
  getChangeAddress: mock(),
  getCollateral: mock(),
  getUtxos: mock(),
  signData: mock(),
  signTx: mock(),
  signTxs: mock(),
  submitTx: mock(),
}

export const address =
  'addr_test1qz2fxv2umyhttkxyxp8x0dlpdt3k6cwng5pxj3jhsydzer3n0d3vllmyqwsx5wktcd8cc3sq835lu7drv2xwl2wywfgs68faae'

export const collateralUtxo = {
  input: {
    txHash: 'cafecafecafecafecafecafecafecafecafecafecafecafecafecafecafecafe',
    outputIndex: 0,
  },
  output: {
    amount: [{unit: 'lovelace', quantity: '5000000'}],
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
    amount: [{unit: 'lovelace', quantity: '8000000'}, assetA, assetB],
    address,
  },
}
