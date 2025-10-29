'use client'

import {deserializeAddress} from '@meshsdk/core'
import {Loader2} from 'lucide-react'
import {redirect} from 'next/navigation'
import {useShallow} from 'zustand/shallow'
import {ErrorAlert} from '@/components/error-alert'
import {useConnectedWalletStore} from '@/store/connected-wallet'
import {UserInteractionsTable} from './user-interactions-table'

const TransactionsPage = () => {
  const {
    connectedWallet,
    isWalletConnecting,
    isHydrated: isConnectedWalletStoreHydrated,
  } = useConnectedWalletStore(
    useShallow(({connectedWallet, isWalletConnecting, isHydrated}) => ({
      connectedWallet,
      isWalletConnecting,
      isHydrated,
    })),
  )

  if (
    !connectedWallet &&
    !isWalletConnecting &&
    isConnectedWalletStoreHydrated
  ) {
    return redirect('/')
  }

  if (isWalletConnecting || !isConnectedWalletStoreHydrated) {
    return (
      <div className="flex min-h-60 items-center justify-center">
        <Loader2 className="size-8 animate-spin" />
      </div>
    )
  }

  if (!connectedWallet) return null

  const stakeKeyHash =
    deserializeAddress(connectedWallet.address).stakeCredentialHash || null

  if (!stakeKeyHash) {
    return (
      <ErrorAlert
        title="Error while fetching transactions"
        description="No stake key hash found"
      />
    )
  }

  return <UserInteractionsTable stakeKeyHash={stakeKeyHash} />
}

export default TransactionsPage
