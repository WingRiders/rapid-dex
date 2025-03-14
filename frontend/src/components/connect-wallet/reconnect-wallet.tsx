'use client'

import {useEffect} from 'react'
import {toast} from 'sonner'
import {useShallow} from 'zustand/shallow'
import {useConnectedWalletStore} from '../../store/connected-wallet'

export const ReconnectWallet = () => {
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
  return <></>
}
