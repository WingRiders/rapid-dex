import {type TRPC, useTRPC} from '@/trpc/client'
import type {Unit} from '@meshsdk/core'
import {skipToken, useQuery, useQueryClient} from '@tanstack/react-query'
import {useSubscription} from '@trpc/tanstack-react-query'
import {keyBy} from 'lodash'
import type {PoolsListItem} from '../types'
import {getInteractionsQueryDataUpdater} from './interactions'
import {wsOnDataDebugLog} from './logger'

export const usePoolsQuery = (options?: {enabled?: boolean}) => {
  const trpc = useTRPC()
  const queryOptions = trpc.pools.queryOptions(undefined, options)

  return useQuery({
    ...queryOptions,
    queryFn: queryOptions.queryFn
      ? async (args) => {
          const originalQueryFn = queryOptions.queryFn!
          const fetchedPools = await originalQueryFn(args)
          const existingPools = args.client.getQueryData(queryOptions.queryKey)
          if (!existingPools || existingPools.length === 0) return fetchedPools

          const existingPoolsByShareAssetName = keyBy(
            existingPools,
            (pool) => pool.shareAssetName,
          )

          const newPools = fetchedPools.map((fetchedPool) => {
            const existingPool =
              existingPoolsByShareAssetName[fetchedPool.shareAssetName]
            if (
              !existingPool ||
              fetchedPool.validAt.getTime() > existingPool.validAt.getTime()
            )
              return fetchedPool

            return existingPool
          })
          const newPoolsShareAssetNames = new Set(
            newPools.map((pool) => pool.shareAssetName),
          )

          // make sure that all existing pools are included in the new pools
          // (there could be an onPoolCreated event while the pools query was loading)
          existingPools.forEach((existingPool) => {
            if (!newPoolsShareAssetNames.has(existingPool.shareAssetName)) {
              newPools.push(existingPool)
            }
          })

          return newPools
        }
      : undefined,
  })
}

export const useLivePoolUtxoQuery = (
  input: Parameters<TRPC['poolUtxo']['queryOptions']>[0],
) => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const queryOptions = trpc.poolUtxo.queryOptions(input)
  const hasInput = typeof input !== 'symbol'

  useSubscription(
    trpc.onPoolUtxoUpdated.subscriptionOptions(
      hasInput ? {shareAssetName: input.shareAssetName} : skipToken,
      {
        onData: (payload) => {
          wsOnDataDebugLog('pool utxo updated', payload)

          queryClient.setQueryData(
            queryOptions.queryKey,
            (existingPoolUtxo) => {
              if (
                !existingPoolUtxo ||
                payload.validAt.getTime() > existingPoolUtxo.validAt.getTime()
              ) {
                return {utxo: payload.utxo, validAt: payload.validAt}
              }

              return existingPoolUtxo
            },
          )
        },
      },
    ),
  )

  return useQuery({
    ...queryOptions,
    queryFn: queryOptions.queryFn
      ? async (args) => {
          const originalQueryFn = queryOptions.queryFn!
          if (typeof originalQueryFn === 'symbol') {
            throw new Error('Pool utxo query function is not callable')
          }
          const fetchedPoolUtxo = await originalQueryFn(args)
          const existingPoolUtxo = args.client.getQueryData(
            queryOptions.queryKey,
          )
          if (
            !existingPoolUtxo ||
            fetchedPoolUtxo.validAt.getTime() >
              existingPoolUtxo.validAt.getTime()
          )
            return fetchedPoolUtxo

          return existingPoolUtxo
        }
      : undefined,
    enabled: !!hasInput,
  })
}

export const useLivePoolInteractionsQuery = (
  input: Parameters<TRPC['poolInteractions']['queryOptions']>[0],
) => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const queryResult = useQuery(trpc.poolInteractions.queryOptions(input))

  useSubscription(
    trpc.onPoolInteractionsUpdate.subscriptionOptions(
      typeof input === 'symbol'
        ? input
        : {poolShareAssetName: input.shareAssetName},
      {
        onData: ({data: updatedInteraction}) => {
          wsOnDataDebugLog('pool interactions updated', updatedInteraction)

          if (typeof input === 'symbol') return

          queryClient.setQueryData(
            trpc.poolInteractions.queryKey(input),
            getInteractionsQueryDataUpdater(updatedInteraction),
          )
        },
      },
    ),
  )

  return queryResult
}

export const matchPoolForUnits =
  (unitX: Unit, unitY: Unit) =>
  (pool: Pick<PoolsListItem, 'unitA' | 'unitB'>) =>
    (unitX === pool.unitA && unitY === pool.unitB) ||
    (unitX === pool.unitB && unitY === pool.unitA)
