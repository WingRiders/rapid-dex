import type {PortfolioItem} from '@/helpers/portfolio'
import {useConnectedWalletStore} from '@/store/connected-wallet'
import type BigNumber from 'bignumber.js'
import {useMemo} from 'react'

type ValidateWithdrawLiquidityFormParams = {
  withdrawingShares: BigNumber | null
  portfolioItem: PortfolioItem
}

export const useValidateWithdrawLiquidityForm = ({
  withdrawingShares,
  portfolioItem,
}: ValidateWithdrawLiquidityFormParams) => {
  const isWalletConnected = useConnectedWalletStore(
    (state) => state.connectedWallet != null,
  )

  return useMemo<string | undefined>(() => {
    if (!isWalletConnected) return 'Connect your wallet'

    if (!withdrawingShares?.gt(0)) return 'Enter quantity of shares to withdraw'

    if (withdrawingShares.gt(portfolioItem.ownedShares))
      return 'Insufficient balance of shares'

    return undefined
  }, [isWalletConnected, portfolioItem, withdrawingShares])
}
