'use client'

import {useTRPC} from '@/trpc/client'
import {useQueryClient} from '@tanstack/react-query'
import {useSubscription} from '@trpc/tanstack-react-query'

export const LivePoolsUpdate = () => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  useSubscription(
    trpc.onPoolStateUpdated.subscriptionOptions(undefined, {
      onData: (payload) => {
        queryClient.setQueryData(trpc.pools.queryKey(), (existingPools) => {
          if (!existingPools) return

          return existingPools.map((existingPool) => {
            if (
              existingPool.shareAssetName === payload.shareAssetName &&
              payload.validAt.getTime() > existingPool.validAt.getTime()
            )
              return {...existingPool, poolState: payload.poolState}

            return existingPool
          })
        })
      },
    }),
  )

  useSubscription(
    trpc.onPoolCreated.subscriptionOptions(undefined, {
      onData: (payload) => {
        queryClient.setQueryData(trpc.pools.queryKey(), (existingPools) => {
          if (!existingPools) return

          const existingPool = existingPools.find(
            (pool) => pool.shareAssetName === payload.pool.shareAssetName,
          )
          // if the pool is not in the list, add it
          if (!existingPool) return [...existingPools, payload.pool]

          return payload.pool.validAt.getTime() > existingPool.validAt.getTime()
            ? // if the pool is in the list, update it if the new pool is newer
              existingPools.map((pool) =>
                pool.shareAssetName === payload.pool.shareAssetName
                  ? payload.pool
                  : pool,
              )
            : existingPools
        })
      },
    }),
  )

  useSubscription(
    trpc.onPoolRolledBack.subscriptionOptions(undefined, {
      onData: (payload) => {
        queryClient.setQueryData(trpc.pools.queryKey(), (existingPools) => {
          if (!existingPools) return

          const existingPool = existingPools.find(
            (pool) => pool.shareAssetName === payload.shareAssetName,
          )
          if (
            !existingPool ||
            payload.validAt.getTime() <= existingPool.validAt.getTime()
          )
            return existingPools

          return existingPools.filter(
            (pool) => pool.shareAssetName !== payload.shareAssetName,
          )
        })
      },
    }),
  )

  return null
}
