import {BrowserWallet} from '@meshsdk/core'
import {
  skipToken,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import BigNumber from 'bignumber.js'
import {useShallow} from 'zustand/shallow'
import {prefetchTokensMetadata} from '../metadata/queries'
import {useConnectedWalletStore} from '../store/connected-wallet'
import {useTRPC} from '../trpc/client'

export const useInstalledWalletsIdsQuery = () =>
  useQuery({
    queryKey: ['installed-wallets-ids'],
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
    queryKey: ['wallet', 'balance', wallet],
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
    queryKey: ['wallet', 'utxos', wallet],
    queryFn: wallet ? () => wallet.getUtxos() : skipToken,
  })
}

export const useSignAndSubmitTxMutation = () => {
  const wallet = useConnectedWalletStore(
    useShallow((state) => state.connectedWallet?.wallet),
  )

  return useMutation({
    mutationKey: ['wallet', 'sign-and-submit-tx', wallet],
    mutationFn: async (tx: string) => {
      if (!wallet) throw new Error('Wallet not connected')
      const signedTx = await wallet.signTx(tx)
      const txHash = await wallet.submitTx(signedTx)
      return {txHash}
    },
  })
}
