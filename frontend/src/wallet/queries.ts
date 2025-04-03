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
import {useCallback} from 'react'
import {useShallow} from 'zustand/shallow'
import {prefetchTokensMetadata} from '../metadata/queries'
import {useConnectedWalletStore} from '../store/connected-wallet'
import {useTRPC} from '../trpc/client'

export const invalidateWalletQueries = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({queryKey: queryKeyFactory.wallet()})
}

export const useInstalledWalletsIdsQuery = () =>
  useQuery({
    queryKey: queryKeyFactory.installedWalletsIds(),
    queryFn: async () => {
      const wallets = await BrowserWallet.getAvailableWallets()
      return new Set(wallets.map((wallet) => wallet.id))
    },
  })

export const useWalletBalanceQuery = () => {
  const wallet = useConnectedWalletStore(
    useShallow((state) => state.connectedWallet?.wallet),
  )
  const queryClient = useQueryClient()
  const trpc = useTRPC()

  return useQuery({
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
    mutationFn: async (tx: string) => {
      if (!wallet) throw new Error('Wallet not connected')
      return wallet.signTx(tx)
    },
  })
}

export const useSubmitTxMutation = () => {
  const wallet = useConnectedWalletStore(
    useShallow((state) => state.connectedWallet?.wallet),
  )

  return useMutation({
    mutationKey: queryKeyFactory.submitTx(),
    mutationFn: async (tx: string) => {
      if (!wallet) throw new Error('Wallet not connected')
      return wallet.submitTx(tx)
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
    async (tx: string) => {
      try {
        const signedTx = await signTx(tx)
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
