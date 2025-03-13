import {BrowserWallet, type Network} from '@meshsdk/core'
import {walletNetworkIdToNetwork} from '@wingriders/rapid-dex-common'
import {create} from 'zustand'
import {persist} from 'zustand/middleware'
import {
  type SupportedWalletType,
  supportedWalletsInfo,
} from '../wallet/supported-wallets'

type ConnectedWallet = {
  wallet: BrowserWallet
  address: string
  network: Network
}

export type ConnectedWalletState = {
  connectedWalletType: SupportedWalletType | null
  connectedWallet: ConnectedWallet | null
  isWalletConnecting: boolean
  connectWallet: (walletType: SupportedWalletType) => Promise<void>
  disconnectWallet: () => void
}

export const useConnectedWalletStore = create<ConnectedWalletState>()(
  persist(
    (set) => ({
      connectedWalletType: null,
      connectedWallet: null,
      isWalletConnecting: false,
      connectWallet: async (walletType) => {
        set({isWalletConnecting: true})
        try {
          const walletId = supportedWalletsInfo[walletType].id
          const wallet = await BrowserWallet.enable(walletId)
          const [address, networkId] = await Promise.all([
            wallet.getChangeAddress(),
            wallet.getNetworkId(),
          ])
          set({
            connectedWallet: {
              wallet,
              address,
              network: walletNetworkIdToNetwork(networkId),
            },
            connectedWalletType: walletType,
            isWalletConnecting: false,
          })
        } catch (error) {
          set({
            isWalletConnecting: false,
            connectedWalletType: null,
            connectedWallet: null,
          })
          throw error
        }
      },
      disconnectWallet: () =>
        set({
          connectedWalletType: null,
          connectedWallet: null,
        }),
    }),
    {
      name: 'connected-wallet',
      partialize: ({connectedWalletType}) => ({
        connectedWalletType,
      }),
    },
  ),
)
