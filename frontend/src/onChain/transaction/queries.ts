import {skipToken, useQuery} from '@tanstack/react-query'
import {useShallow} from 'zustand/shallow'
import {useConnectedWalletStore} from '../../store/connected-wallet'
import {type BuildCreatePoolTxArgs, buildCreatePoolTx} from './create-pool'

export const useBuildCreatePoolTxQuery = (
  args: BuildCreatePoolTxArgs | undefined,
) => {
  const wallet = useConnectedWalletStore(
    useShallow((state) => state.connectedWallet?.wallet),
  )

  return useQuery({
    queryKey: ['build-create-pool-tx', args, wallet],
    queryFn: wallet && args ? () => buildCreatePoolTx(args) : skipToken,
  })
}
