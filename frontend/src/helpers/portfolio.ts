import {useConnectedWalletStore} from '@/store/connected-wallet'
import type {PoolsListItem} from '@/types'
import {useWalletBalanceQuery} from '@/wallet/queries'
import {skipToken, useQuery} from '@tanstack/react-query'
import {createUnit, poolValidatorHash} from '@wingriders/rapid-dex-common'
import type BigNumber from 'bignumber.js'
import {compact, keyBy} from 'lodash'
import {usePoolsQuery} from './pool'

export type PortfolioItem = {
  pool: PoolsListItem
  ownedShares: BigNumber
}

export const usePortfolioQuery = () => {
  const isWalletConnected = useConnectedWalletStore(
    (state) => state.connectedWallet != null,
  )

  const {data: pools, isLoading: isLoadingPools} = usePoolsQuery({
    enabled: isWalletConnected,
  })
  const {data: balance, isLoading: isLoadingBalance} = useWalletBalanceQuery()

  const {data: portfolioItems, isLoading: isLoadingPortfolioItems} = useQuery({
    queryKey: ['wallet', 'portfolio', pools, balance],
    queryFn:
      pools && balance
        ? () => {
            const portfolioItems = compact(
              pools.map<PortfolioItem | undefined>((pool) => {
                const ownedShares =
                  balance[createUnit(poolValidatorHash, pool.shareAssetName)]

                if (!ownedShares?.gt(0)) return undefined

                return {
                  pool,
                  ownedShares,
                }
              }),
            )

            return keyBy(portfolioItems, (item) => item.pool.shareAssetName)
          }
        : skipToken,
  })

  return {
    portfolioItems,
    isLoading: isLoadingPools || isLoadingBalance || isLoadingPortfolioItems,
  }
}
