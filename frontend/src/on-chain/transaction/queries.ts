import {skipToken, useQuery} from '@tanstack/react-query'
import {
  type BuildAddLiquidityTxArgs,
  type BuildCreatePoolTxArgs,
  type BuildSwapTxArgs,
  type BuildWithdrawLiquidityTxArgs,
  buildAddLiquidityTx,
  buildCreatePoolTx,
  buildSwapTx,
  buildWithdrawLiquidityTx,
} from '@wingriders/rapid-dex-sdk-core'
import {useShallow} from 'zustand/shallow'
import {queryKeyFactory} from '@/helpers/query-key'
import {useConnectedWalletStore} from '../../store/connected-wallet'

export const useBuildCreatePoolTxQuery = (
  args: Omit<BuildCreatePoolTxArgs, 'wallet'> | undefined,
) => {
  const wallet = useConnectedWalletStore(
    useShallow((state) => state.connectedWallet?.wallet),
  )

  return useQuery({
    queryKey: queryKeyFactory.buildCreatePoolTx(args),
    queryFn:
      wallet && args ? () => buildCreatePoolTx({...args, wallet}) : skipToken,
    staleTime: 0,
  })
}

export const useBuildSwapTxQuery = (
  args: Omit<BuildSwapTxArgs, 'wallet'> | undefined,
) => {
  const wallet = useConnectedWalletStore(
    useShallow((state) => state.connectedWallet?.wallet),
  )

  return useQuery({
    queryKey: queryKeyFactory.buildSwapTx(args),
    queryFn: wallet && args ? () => buildSwapTx({...args, wallet}) : skipToken,
    staleTime: 0,
  })
}

export const useBuildAddLiquidityTxQuery = (
  args: Omit<BuildAddLiquidityTxArgs, 'wallet'> | undefined,
) => {
  const wallet = useConnectedWalletStore(
    useShallow((state) => state.connectedWallet?.wallet),
  )

  return useQuery({
    queryKey: queryKeyFactory.buildAddLiquidityTx(args),
    queryFn:
      wallet && args ? () => buildAddLiquidityTx({...args, wallet}) : skipToken,
    staleTime: 0,
  })
}

export const useBuildWithdrawLiquidityTxQuery = (
  args: Omit<BuildWithdrawLiquidityTxArgs, 'wallet'> | undefined,
) => {
  const wallet = useConnectedWalletStore(
    useShallow((state) => state.connectedWallet?.wallet),
  )

  return useQuery({
    queryKey: queryKeyFactory.buildWithdrawLiquidityTx(args),
    queryFn:
      wallet && args
        ? () => buildWithdrawLiquidityTx({...args, wallet})
        : skipToken,
    staleTime: 0,
  })
}
