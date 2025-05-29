import {env} from '@/config'
import {queryKeyFactory} from '@/helpers/query-key'
import {BrowserWallet} from '@meshsdk/core'
import {
  type QueryClient,
  skipToken,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import BigNumber from 'bignumber.js'
import {partition} from 'lodash'
import {useCallback} from 'react'
import {useShallow} from 'zustand/shallow'
import {prefetchTokensMetadata} from '../metadata/queries'
import {useConnectedWalletStore} from '../store/connected-wallet'
import {useTRPC} from '../trpc/client'

export const invalidateWalletQueries = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({queryKey: queryKeyFactory.wallet()})
  queryClient.resetQueries({queryKey: queryKeyFactory.walletMutation()})
}

export const useInstalledWalletsIdsQuery = () =>
  useQuery({
    queryKey: queryKeyFactory.installedWalletsIds(),
    queryFn: async () => {
      const wallets = await BrowserWallet.getAvailableWallets()
      return new Set(wallets.map((wallet) => wallet.id))
    },
  })

export type WalletBalanceState = 'loading' | 'has-data' | 'no-data'

export const useWalletBalanceQuery = () => {
  const {wallet, isWalletConnecting} = useConnectedWalletStore(
    useShallow((state) => ({
      wallet: state.connectedWallet?.wallet,
      isWalletConnecting: state.isWalletConnecting,
    })),
  )
  const queryClient = useQueryClient()
  const trpc = useTRPC()

  const queryResult = useQuery({
    queryKey: queryKeyFactory.walletBalance(),
    queryFn: wallet
      ? async () => {
          const balance = await wallet.getBalance()

          // prefetch metadata for all assets in the wallet
          await prefetchTokensMetadata(
            balance.map((asset) => asset.unit),
            queryClient,
            trpc,
          )

          return Object.fromEntries(
            balance.map(({unit, quantity}) => [unit, new BigNumber(quantity)]),
          )
        }
      : skipToken,
  })

  const balanceState: WalletBalanceState = queryResult.isLoading
    ? 'loading'
    : queryResult.data != null
      ? 'has-data'
      : 'no-data'

  return {
    ...queryResult,
    isLoading: queryResult.isLoading || isWalletConnecting,
    balanceState,
  }
}

export type WalletBalance = Exclude<
  ReturnType<typeof useWalletBalanceQuery>['data'],
  undefined
>

export const useWalletUtxosQuery = () => {
  const wallet = useConnectedWalletStore(
    useShallow((state) => state.connectedWallet?.wallet),
  )

  return useQuery({
    queryKey: queryKeyFactory.walletUtxos(),
    queryFn: wallet ? () => wallet.getUtxos() : skipToken,
  })
}

export const useSignTxMutation = () => {
  const wallet = useConnectedWalletStore(
    useShallow((state) => state.connectedWallet?.wallet),
  )

  return useMutation({
    mutationKey: queryKeyFactory.signTx(),
    mutationFn: async (args: {tx: string; partialSign?: boolean}) => {
      if (!wallet) throw new Error('Wallet not connected')
      return wallet.signTx(args.tx, args.partialSign)
    },
  })
}

export const useSubmitTxMutation = () => {
  const trpc = useTRPC()
  const wallet = useConnectedWalletStore(
    useShallow((state) => state.connectedWallet?.wallet),
  )

  const submitThroughBackend = (tx: string) => {
    const submitFn = trpc.submitTx.mutationOptions().mutationFn
    if (!submitFn) throw new Error('Submit function not found')
    return submitFn(tx)
  }

  const submitThroughWallet = (tx: string) => {
    if (!wallet) throw new Error('Wallet not connected')
    return wallet.submitTx(tx)
  }

  return useMutation({
    mutationKey: queryKeyFactory.submitTx(),
    mutationFn: async (tx: string) => {
      const submitMethod = env('NEXT_PUBLIC_SUBMIT_TX_METHOD')
      const submitPromises: Promise<
        {success: true; txHash: string} | {success: false; error: any}
      >[] = []

      if (['backend', 'both'].includes(submitMethod))
        submitPromises.push(
          submitThroughBackend(tx)
            .then((txHash) => ({success: true, txHash}) as const)
            .catch((error) => ({success: false, error})),
        )

      if (['wallet', 'both'].includes(submitMethod)) {
        submitPromises.push(
          submitThroughWallet(tx)
            .then((txHash) => ({success: true, txHash}) as const)
            .catch((error) => ({success: false, error})),
        )
      }

      const results = await Promise.all(submitPromises)
      if (results.length === 0) throw new Error('No submit method selected')

      const [successful, failed] = partition(
        results,
        (result) => result.success,
      )
      if (successful.length > 0) {
        if (failed.length > 0) {
          console.error('Failed to submit transaction', failed)
        }
        return successful[0]!.txHash // assuming all successful results are the same
      }

      const errorMessages = failed
        .map((f) => f.error?.message || 'Unknown error')
        .join('; ')
      throw new Error(`Failed to submit transaction: ${errorMessages}`)
    },
  })
}

export const useSignAndSubmitTxMutation = () => {
  const {
    mutateAsync: signTx,
    reset: resetSignTx,
    ...signTxMutationResult
  } = useSignTxMutation()

  const {
    mutateAsync: submitTx,
    reset: resetSubmitTx,
    ...submitTxMutationResult
  } = useSubmitTxMutation()

  const signAndSubmitTx = useCallback(
    async (tx: string, partialSign?: boolean) => {
      try {
        const signedTx = await signTx({tx, partialSign})
        const txHash = await submitTx(signedTx)
        return {txHash}
      } catch {
        // pass, the error is handled in the mutation results
      }
    },
    [signTx, submitTx],
  )

  const reset = useCallback(() => {
    resetSignTx()
    resetSubmitTx()
  }, [resetSignTx, resetSubmitTx])

  return {
    signAndSubmitTx,
    reset,
    isPending:
      signTxMutationResult.isPending || submitTxMutationResult.isPending,
    isError: signTxMutationResult.isError || submitTxMutationResult.isError,
    signTxMutationResult,
    submitTxMutationResult,
  }
}
