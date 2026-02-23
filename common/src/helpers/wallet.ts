export enum NetworkId {
  TESTNET = 0,
  MAINNET = 1,
}

export const supportedNetworks = ['preprod', 'mainnet'] as const
export type SupportedNetwork = (typeof supportedNetworks)[number]

export const walletNetworkIdToNetwork = (
  networkId: NetworkId,
): SupportedNetwork => {
  switch (networkId) {
    case NetworkId.TESTNET:
      return 'preprod'
    case NetworkId.MAINNET:
      return 'mainnet'
    default:
      throw new Error(`Unknown network id: ${networkId}`)
  }
}
