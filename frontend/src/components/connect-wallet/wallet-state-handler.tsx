'use client'

import {queryKeyFactory} from '@/helpers/query-key'
import {useConnectedWalletStore} from '@/store/connected-wallet'
import {BrowserWallet} from '@meshsdk/core'

import {useLocalInteractionsStore} from '@/store/local-interactions'
import {supportedWalletsInfo} from '@/wallet/supported-wallets'
import {useQueryClient} from '@tanstack/react-query'
import {useEffect} from 'react'
import {toast} from 'sonner'
import {useShallow} from 'zustand/shallow'

/**
 * This component:
 * - Reconnects the wallet if it is not connected (when the app loads)
 * - Reconnects the wallet on window focus if the wallet address has changed (e.g. when user switches accounts in the wallet)
 * - Clears the local interactions when the wallet is reconnected because the wallet address has changed or when the wallet is disconnected
 */
export const WalletStateHandler = () => {
  const queryClient = useQueryClient()

  const {
    connectedWalletType,
    connectedWallet,
    connectWallet,
    disconnectWallet,
    isWalletConnecting,
    isHydrated: isConnectedWalletStoreHydrated,
  } = useConnectedWalletStore(
    useShallow(
      ({
        connectedWalletType,
        connectedWallet,
        connectWallet,
        disconnectWallet,
        isWalletConnecting,
        isHydrated,
      }) => ({
        connectedWalletType,
        connectedWallet,
        connectWallet,
        disconnectWallet,
        isWalletConnecting,
        isHydrated,
      }),
    ),
  )

  const {clear: clearLocalInteractions} = useLocalInteractionsStore(
    useShallow(({clear}) => ({clear})),
  )

  useEffect(() => {
    const reconnectWallet = async () => {
      if (!connectedWallet && connectedWalletType && !isWalletConnecting) {
        try {
          await connectWallet(connectedWalletType)
          toast.success('Wallet connected successfully!')
        } catch (error) {
          disconnectWallet(queryClient)
          toast.error('Failed to connect wallet!', {
            description:
              error instanceof Error ? error.message : 'Unknown error',
          })
          console.error(error)
        }
      }
    }

    reconnectWallet()
  }, [
    connectedWallet,
    connectedWalletType,
    connectWallet,
    disconnectWallet,
    isWalletConnecting,
    queryClient,
  ])

  useEffect(() => {
    const handleFocus = async () => {
      if (connectedWallet && connectedWalletType) {
        try {
          const walletId = supportedWalletsInfo[connectedWalletType].id
          const wallet = await BrowserWallet.enable(walletId)
          const newAddress = await wallet.getChangeAddress()
          if (newAddress !== connectedWallet.address) {
            await connectWallet(connectedWalletType, wallet)
            queryClient.resetQueries({queryKey: queryKeyFactory.wallet()})
            clearLocalInteractions()
            toast.success('Wallet connected successfully!')
          }
        } catch (error) {
          disconnectWallet(queryClient)
          toast.error('Failed to connect wallet!', {
            description:
              error instanceof Error ? error.message : 'Unknown error',
          })
          console.error(error)
        }
      }
    }

    window.addEventListener('focus', handleFocus)

    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [
    connectedWallet,
    connectedWalletType,
    connectWallet,
    disconnectWallet,
    clearLocalInteractions,
    queryClient,
  ])

  useEffect(() => {
    if (
      !connectedWallet &&
      !connectedWalletType &&
      !isWalletConnecting &&
      isConnectedWalletStoreHydrated
    ) {
      clearLocalInteractions()
    }
  }, [
    connectedWallet,
    connectedWalletType,
    isWalletConnecting,
    clearLocalInteractions,
    isConnectedWalletStoreHydrated,
  ])

  return <></>
}
