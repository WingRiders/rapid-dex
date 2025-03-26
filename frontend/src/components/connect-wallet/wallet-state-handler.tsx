'use client'

import {queryKeyFactory} from '@/helpers/query-key'
import {useConnectedWalletStore} from '@/store/connected-wallet'
import {BrowserWallet} from '@meshsdk/core'

import {supportedWalletsInfo} from '@/wallet/supported-wallets'
import {useQueryClient} from '@tanstack/react-query'
import {useEffect} from 'react'
import {toast} from 'sonner'
import {useShallow} from 'zustand/shallow'

/**
 * This component:
 * - Reconnects the wallet if it is not connected (when the app loads)
 * - Invalidates the wallet queries when wallet API changes
 * - Reconnects the wallet on window focus if the wallet address has changed (e.g. when user switches accounts in the wallet)
 */
export const WalletStateHandler = () => {
  const queryClient = useQueryClient()

  const {
    connectedWalletType,
    connectedWallet,
    connectWallet,
    disconnectWallet,
    isWalletConnecting,
  } = useConnectedWalletStore(
    useShallow(
      ({
        connectedWalletType,
        connectedWallet,
        connectWallet,
        disconnectWallet,
        isWalletConnecting,
      }) => ({
        connectedWalletType,
        connectedWallet,
        connectWallet,
        disconnectWallet,
        isWalletConnecting,
      }),
    ),
  )

  useEffect(() => {
    const reconnectWallet = async () => {
      if (!connectedWallet && connectedWalletType && !isWalletConnecting) {
        try {
          await connectWallet(connectedWalletType)
          toast.success('Wallet connected successfully!')
        } catch (error) {
          disconnectWallet()
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
  ])

  // biome-ignore lint/correctness/useExhaustiveDependencies: We want to reset the wallet queries when wallet API changes
  useEffect(() => {
    queryClient.resetQueries({queryKey: queryKeyFactory.wallet()})
  }, [connectedWallet?.wallet, queryClient])

  useEffect(() => {
    const handleFocus = async () => {
      if (connectedWallet && connectedWalletType) {
        try {
          const walletId = supportedWalletsInfo[connectedWalletType].id
          const wallet = await BrowserWallet.enable(walletId)
          const newAddress = await wallet.getChangeAddress()
          if (newAddress !== connectedWallet.address) {
            connectWallet(connectedWalletType, wallet)
            toast.success('Wallet connected successfully!')
          }
        } catch (error) {
          disconnectWallet()
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
  }, [connectedWallet, connectedWalletType, connectWallet, disconnectWallet])

  return <></>
}
