'use client'

import {deserializeAddress} from '@meshsdk/core'
import {useQueryClient} from '@tanstack/react-query'
import {useSubscription} from '@trpc/tanstack-react-query'
import {secondsToMilliseconds} from 'date-fns'
import {throttle} from 'lodash'
import {toast} from 'sonner'
import {getInteractionsQueryDataUpdater} from '@/helpers/interactions'
import {wsOnDataDebugLog} from '@/helpers/logger'
import {useConnectedWalletStore} from '@/store/connected-wallet'
import {useTRPC} from '@/trpc/client'
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

type LiveUserInteractionsUpdatesProps = {
  stakeKeyHash: string
}

const LiveUserInteractionsUpdates = ({
  stakeKeyHash,
}: LiveUserInteractionsUpdatesProps) => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  useSubscription(
    trpc.onUserInteractionsUpdate.subscriptionOptions(
      {stakeKeyHash},
      {
        onData: ({data: updatedInteraction}) => {
          wsOnDataDebugLog('user interactions updated', updatedInteraction)

          const changedStatusToConfirmed =
            updatedInteraction.slot != null &&
            queryClient
              .getQueryData(
                trpc.userInteractions.queryKey({
                  stakeKeyHash,
                  onlyUnconfirmed: true,
                }),
              )
              ?.some(
                (i) => i.txHash === updatedInteraction.txHash && i.slot == null,
              )

          if (changedStatusToConfirmed) {
            toast.success('Your transaction was confirmed on-chain')
            // throttling wallet invalidation in case of multiple interactions confirmed in the same block
            invalidateWalletQueriesThrottled(queryClient)
          }

          queryClient.setQueryData(
            trpc.userInteractions.queryKey({
              stakeKeyHash,
            }),
            getInteractionsQueryDataUpdater(updatedInteraction),
          )
          queryClient.setQueryData(
            trpc.userInteractions.queryKey({
              stakeKeyHash,
              onlyUnconfirmed: false,
            }),
            getInteractionsQueryDataUpdater(updatedInteraction),
          )

          queryClient.setQueryData(
            trpc.userInteractions.queryKey({
              stakeKeyHash,
              onlyUnconfirmed: true,
            }),
            getInteractionsQueryDataUpdater(updatedInteraction, true),
          )
        },
      },
    ),
  )

  return null
}

const LiveInteractionsUpdatesIfWalletIsConnected = () => {
  const connectedWallet = useConnectedWalletStore(
    ({connectedWallet}) => connectedWallet,
  )
  if (!connectedWallet) return null

  const stakeKeyHash =
    deserializeAddress(connectedWallet.address).stakeCredentialHash || null

  return stakeKeyHash ? (
    <LiveUserInteractionsUpdates stakeKeyHash={stakeKeyHash} />
  ) : null
}

export {
  LiveInteractionsUpdatesIfWalletIsConnected as LiveUserInteractionsUpdates,
}
