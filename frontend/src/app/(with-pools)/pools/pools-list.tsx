'use client'

import {ErrorAlert} from '@/components/error-alert'
import {PoolsTable} from '@/components/pools-table'
import {usePoolsQuery} from '@/helpers/pool'
import {Loader2} from 'lucide-react'

export const PoolsList = () => {
  const {data: pools, isLoading, error} = usePoolsQuery()

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
