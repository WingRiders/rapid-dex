'use client'

import {deserializeAddress} from '@meshsdk/core'
import {useQueryClient} from '@tanstack/react-query'
import {LiveUserInteractionsUpdates} from '@wingriders/rapid-dex-sdk-react'
import {secondsToMilliseconds} from 'date-fns'
import {throttle} from 'lodash'
import {toast} from 'sonner'
import {useConnectedWalletStore} from '@/store/connected-wallet'
import {invalidateWalletQueries} from '@/wallet/queries'

const WALLET_REFETCH_DELAY_MS = secondsToMilliseconds(2)

const invalidateWalletQueriesThrottled = throttle(
  invalidateWalletQueries,
  WALLET_REFETCH_DELAY_MS,
  {
    leading: false,
    trailing: true,
  },
)

const LiveInteractionsUpdatesIfWalletIsConnected = () => {
  const queryClient = useQueryClient()

  const connectedWallet = useConnectedWalletStore(
    ({connectedWallet}) => connectedWallet,
  )
  if (!connectedWallet) return null

  const stakeKeyHash =
    deserializeAddress(connectedWallet.address).stakeCredentialHash || null

  return stakeKeyHash ? (
    <LiveUserInteractionsUpdates
      stakeKeyHash={stakeKeyHash}
      onInteractionConfirmed={() => {
        toast.success('Your transaction was confirmed on-chain')
        // throttling wallet invalidation in case of multiple interactions confirmed in the same block
        invalidateWalletQueriesThrottled(queryClient)
      }}
    />
  ) : null
}

export {
  LiveInteractionsUpdatesIfWalletIsConnected as LiveUserInteractionsUpdates,
}
