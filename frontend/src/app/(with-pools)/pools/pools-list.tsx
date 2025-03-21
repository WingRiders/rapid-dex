'use client'

import {ErrorAlert} from '@/components/error-alert'
import {PoolsTable} from '@/components/pools-table'
import {useTRPC} from '@/trpc/client'
import {useQuery} from '@tanstack/react-query'
import {Loader2} from 'lucide-react'

export const PoolsList = () => {
  const trpc = useTRPC()
  const {data: pools, isLoading, error} = useQuery(trpc.pools.queryOptions())

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

  return <PoolsTable pools={pools} />
}
