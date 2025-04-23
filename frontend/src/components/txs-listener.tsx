'use client'
import {wsOnDataDebugLog} from '@/helpers/logger'
import {useLocalInteractionsStore} from '@/store/local-interactions'
import {useTRPC} from '@/trpc/client'
import {invalidateWalletQueries} from '@/wallet/queries'
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
  const unconfirmedTxHashes = useMemo(
    () => unconfirmedInteractions.map(({txHash}) => txHash),
    [unconfirmedInteractions],
  )

  const handleTxsAddedToBlock = useHandleTxsAddedToBlock()

  // query the data directly besides WS in case the WS connection is lost
  // or if the tx is added to a block while the app is not opened
  const isPoolTxInBlockQueries = useQueries({
    queries: unconfirmedTxHashes.map((txHash) =>
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
    const confirmedTxHashes = isPoolTxInBlockQueriesData.flatMap(
      (queryData) => {
        if (
          queryData?.isInBlock &&
          unconfirmedTxHashes.includes(queryData.txHash) // check whether it's still unconfirmed
        ) {
          return [queryData.txHash]
        }
        return []
      },
    )
    if (confirmedTxHashes.length > 0) {
      handleTxsAddedToBlock(confirmedTxHashes)
    }
  }, [isPoolTxInBlockQueriesData, handleTxsAddedToBlock, unconfirmedTxHashes])

  useSubscription(
    trpc.onTxsAddedToBlock.subscriptionOptions(
      {
        txHashes: unconfirmedTxHashes,
      },
      {
        onData: (txHashes) => {
          wsOnDataDebugLog('transactions confirmed on-chain', txHashes)

          const confirmedTxHashes = txHashes.filter((txHash) =>
            unconfirmedTxHashes.includes(txHash),
          )
          if (confirmedTxHashes.length > 0) {
            handleTxsAddedToBlock(confirmedTxHashes)
          }
        },
      },
    ),
  )

  return null
}

const useHandleTxsAddedToBlock = () => {
  const queryClient = useQueryClient()

  const {removeUnconfirmedInteractions} = useLocalInteractionsStore(
    useShallow(({removeUnconfirmedInteractions}) => ({
      removeUnconfirmedInteractions,
    })),
  )

  return useCallback(
    async (txHashes: string[]) => {
      removeUnconfirmedInteractions(txHashes)
      txHashes.forEach(() => {
        toast.success('Your transaction was confirmed on-chain')
      })

      // give the wallet some time to update before we refetch wallet data
      await new Promise((resolve) =>
        setTimeout(resolve, WALLET_REFETCH_DELAY_MS),
      )
      invalidateWalletQueries(queryClient)
    },
    [removeUnconfirmedInteractions, queryClient],
  )
}

const TxsListenerIfWalletIsConnected = () => {
  const isWalletConnected = useConnectedWalletStore(
    ({connectedWallet}) => connectedWallet != null,
  )

  return isWalletConnected ? <TxsListener /> : null
}

export {TxsListenerIfWalletIsConnected as TxsListener}
