'use client'

import {useQueryClient} from '@tanstack/react-query'
import {useSubscription} from '@trpc/tanstack-react-query'
import type {Interaction} from '@wingriders/rapid-dex-common'
import {
  getInteractionsQueryDataUpdater,
  useTRPC,
} from '@wingriders/rapid-dex-sdk-react'

type LiveUserInteractionsUpdatesProps = {
  stakeKeyHash: string
  onInteractionConfirmed?: (interaction: Interaction) => void
}

export const LiveUserInteractionsUpdates = ({
  stakeKeyHash,
  onInteractionConfirmed,
}: LiveUserInteractionsUpdatesProps) => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  useSubscription(
    trpc.onUserInteractionsUpdate.subscriptionOptions(
      {stakeKeyHash},
      {
        onData: ({data: updatedInteraction}) => {
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
            onInteractionConfirmed?.(updatedInteraction)
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
