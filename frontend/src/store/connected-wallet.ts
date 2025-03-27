import {queryKeyFactory} from '@/helpers/query-key'
import {BrowserWallet, type Network} from '@meshsdk/core'
import type {QueryClient} from '@tanstack/react-query'
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
  connectWallet: (
    walletType: SupportedWalletType,
    walletApi?: BrowserWallet,
  ) => Promise<void>
  disconnectWallet: (queryClient: QueryClient) => void
  isHydrated: boolean
}

export const useConnectedWalletStore = create<ConnectedWalletState>()(
  persist(
    (set) => ({
      connectedWalletType: null,
      connectedWallet: null,
      isWalletConnecting: false,
      isHydrated: false,
      connectWallet: async (walletType, walletApi) => {
        set({isWalletConnecting: true})
        try {
          const walletId = supportedWalletsInfo[walletType].id
          const wallet = walletApi ?? (await BrowserWallet.enable(walletId))
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
      disconnectWallet: (queryClient) => {
        set({
          connectedWalletType: null,
          connectedWallet: null,
        })
        // using setTimeout so that the invalidation is executed after the store state is updated in all components
        setTimeout(() => {
          queryClient.resetQueries({queryKey: queryKeyFactory.wallet()})
        }, 0)
      },
    }),
    {
      name: 'connected-wallet',
      partialize: ({connectedWalletType}) => ({
        connectedWalletType,
      }),
      onRehydrateStorage: () => {
        return (state) => {
          if (state) state.isHydrated = true
        }
      },
    },
  ),
)
