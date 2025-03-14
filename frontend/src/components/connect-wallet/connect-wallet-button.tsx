'use client'

import {useState} from 'react'
import {useShallow} from 'zustand/shallow'
import {shortLabel} from '../../helpers/short-label'
import {useConnectedWalletStore} from '../../store/connected-wallet'
import type {SupportedWalletType} from '../../wallet/supported-wallets'
import {AccountDialog} from '../account-dialog'
import {Button} from '../ui/button'
import {ConnectWalletDialog} from './connect-wallet-dialog'

export const ConnectWalletButton = () => {
  const {connectedWallet, isWalletConnecting, connectWallet} =
    useConnectedWalletStore(
      useShallow(
        ({
          connectedWallet,
          isWalletConnecting,
          connectWallet,
          disconnectWallet,
        }) => ({
          connectedWallet,
          isWalletConnecting,
          connectWallet,
          disconnectWallet,
        }),
      ),
    )

  const [isConnectWalletDialogOpen, setIsConnectWalletDialogOpen] =
    useState(false)
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false)

  const handleClick = () => {
    if (connectedWallet) setIsAccountDialogOpen(true)
    else setIsConnectWalletDialogOpen(true)
  }

  const handleConnect = (walletType: SupportedWalletType) => {
    connectWallet(walletType)
    setIsConnectWalletDialogOpen(false)
  }

  return (
    <>
      <Button
        loading={isWalletConnecting}
        disabled={isWalletConnecting}
        onClick={handleClick}
        size="lg"
      >
        {connectedWallet
          ? shortLabel(connectedWallet.address, 10, 5)
          : 'Connect wallet'}
      </Button>

      <ConnectWalletDialog
        open={isConnectWalletDialogOpen}
        onOpenChange={setIsConnectWalletDialogOpen}
        onConnect={handleConnect}
      />

      <AccountDialog
        open={isAccountDialogOpen}
        onOpenChange={setIsAccountDialogOpen}
      />
    </>
  )
}
