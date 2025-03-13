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
