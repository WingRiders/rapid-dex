'use client'

import {useQuery} from '@tanstack/react-query'
import {usePoolsQuery, useTRPC} from '@wingriders/rapid-dex-sdk-react'
import {Loader2} from 'lucide-react'
import {ErrorAlert} from '@/components/error-alert'
import {PoolsTable} from '@/components/pools-table'
import {usePortfolioQuery} from '@/helpers/portfolio'

export const PoolsList = () => {
  const trpc = useTRPC()

  const {data: pools, isLoading, error} = usePoolsQuery()
  const {portfolioItems} = usePortfolioQuery()
  const {data: poolsVolume24h, isLoading: isLoadingPoolsVolume24h} = useQuery(
    trpc.poolsVolume.queryOptions({hoursOffset: 24}),
  )

  if (isLoading)
    return (
      <div className="flex min-h-60 items-center justify-center">
        <Loader2 className="size-8 animate-spin" />
      </div>
    )

  if (error)
    return (
      <div>
        <ErrorAlert
          title="Error while fetching liquidity pools"
          description={error.message}
        />
      </div>
    )

  if (!pools) return null

  return (
    <PoolsTable
      pools={pools}
      portfolioItems={portfolioItems}
      poolsVolume24h={poolsVolume24h}
      isLoadingPoolsVolume24h={isLoadingPoolsVolume24h}
    />
  )
}
