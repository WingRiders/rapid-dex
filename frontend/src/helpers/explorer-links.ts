import type {Network} from '@meshsdk/core'

interface IExplorerLinks {
  address: (address: string) => string
  transaction: (txHash: string) => string
  policy: (policyId: string) => string
}

export class CardanoscanLinks implements IExplorerLinks {
  private baseUrl: string

  constructor(network: Network) {
    switch (network) {
      case 'mainnet':
        this.baseUrl = 'https://cardanoscan.io'
        break
      case 'preprod':
        this.baseUrl = 'https://preprod.cardanoscan.io'
        break
      default:
        throw new Error(`Unsupported network: ${network}`)
    }
  }

  address(address: string): string {
    return `${this.baseUrl}/address/${address}`
  }

  transaction(txHash: string): string {
    return `${this.baseUrl}/transaction/${txHash}`
  }

  policy(policyId: string): string {
    return `${this.baseUrl}/tokenPolicy/${policyId}`
  }
}
