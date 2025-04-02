'use client'

import {queryKeyFactory} from '@/helpers/query-key'
import {useLocalInteractionsStore} from '@/store/local-interactions'
import {useTRPC} from '@/trpc/client'
import {useQueries, useQueryClient} from '@tanstack/react-query'
import {useSubscription} from '@trpc/tanstack-react-query'
import {minutesToMilliseconds, secondsToMilliseconds} from 'date-fns'
import {useCallback, useEffect, useMemo} from 'react'
import {toast} from 'sonner'
import {useShallow} from 'zustand/shallow'
import {useConnectedWalletStore} from '../store/connected-wallet'

const UNCONFIRMED_TXS_REFETCH_INTERVAL_MS = minutesToMilliseconds(1)
const WALLET_REFETCH_DELAY_MS = secondsToMilliseconds(2)

const TxsListener = () => {
  const trpc = useTRPC()

  const {unconfirmedInteractions} = useLocalInteractionsStore(
    useShallow(({unconfirmedInteractions}) => ({
      unconfirmedInteractions,
    })),
  )
  const unconfirmedTxsHashes = useMemo(
    () => unconfirmedInteractions.map(({txHash}) => txHash),
    [unconfirmedInteractions],
  )

  const handleTxAddedToBlock = useHandleTxAddedToBlock()

  // query the data directly besides WS in case the WS connection is lost
  // or if the tx is added to a block while the app is not opened
  const isPoolTxInBlockQueries = useQueries({
    queries: unconfirmedTxsHashes.map((txHash) =>
      trpc.isPoolTxInBlock.queryOptions(
        {txHash},
        {
          refetchOnWindowFocus: 'always',
          refetchInterval: UNCONFIRMED_TXS_REFETCH_INTERVAL_MS,
        },
      ),
    ),
  })
  const isPoolTxInBlockQueriesData = isPoolTxInBlockQueries.map(
    (query) => query.data,
  )

  useEffect(() => {
    isPoolTxInBlockQueriesData.forEach((queryData) => {
      if (
        queryData?.isInBlock &&
        unconfirmedTxsHashes.includes(queryData.txHash) // check whether it's still unconfirmed
      ) {
        handleTxAddedToBlock(queryData.txHash)
      }
    })
  }, [isPoolTxInBlockQueriesData, handleTxAddedToBlock, unconfirmedTxsHashes])

  useSubscription(
    trpc.onTxAddedToBlock.subscriptionOptions(
      {
        txHashes: unconfirmedTxsHashes,
      },
      {
        onData: (txHash) => {
          // check whether it's still unconfirmed
          if (unconfirmedTxsHashes.includes(txHash)) {
            handleTxAddedToBlock(txHash)
          }
        },
      },
    ),
  )

  return null
}

const useHandleTxAddedToBlock = () => {
  const queryClient = useQueryClient()

  const {removeUnconfirmedInteraction} = useLocalInteractionsStore(
    useShallow(({removeUnconfirmedInteraction}) => ({
      removeUnconfirmedInteraction,
    })),
  )

  return useCallback(
    async (txHash: string) => {
      removeUnconfirmedInteraction(txHash)
      toast.success('Your transaction was confirmed on-chain')

      // give the wallet some time to update before we refetch wallet data
      await new Promise((resolve) =>
        setTimeout(resolve, WALLET_REFETCH_DELAY_MS),
      )
      queryClient.invalidateQueries({queryKey: queryKeyFactory.wallet()})
    },
    [removeUnconfirmedInteraction, queryClient],
  )
}

const TxsListenerIfWalletIsConnected = () => {
  const isWalletConnected = useConnectedWalletStore(
    ({connectedWallet}) => connectedWallet != null,
  )

  return isWalletConnected ? <TxsListener /> : null
}

export {TxsListenerIfWalletIsConnected as TxsListener}
