import type {Network} from '@meshsdk/core'

export enum NetworkId {
  TESTNET = 0,
  MAINNET = 1,
}

export const walletNetworkIdToNetwork = (networkId: NetworkId): Network => {
  switch (networkId) {
    case NetworkId.TESTNET:
      return 'preprod'
    case NetworkId.MAINNET:
      return 'mainnet'
    default:
      throw new Error(`Unknown network id: ${networkId}`)
  }
}
