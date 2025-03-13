export enum NetworkId {
  TESTNET = 0,
  MAINNET = 1,
}

// Mainnet will be added once bootstrap is done
const supportedNetworks = ['preprod'] as const
export type SupportedNetwork = (typeof supportedNetworks)[number]

export const walletNetworkIdToNetwork = (
  networkId: NetworkId,
): SupportedNetwork => {
  switch (networkId) {
    case NetworkId.TESTNET:
      return 'preprod'
    case NetworkId.MAINNET:
      throw new Error('Mainnet is not supported yet')
    // return 'mainnet'
    default:
      throw new Error(`Unknown network id: ${networkId}`)
  }
}
