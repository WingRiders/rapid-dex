import 'server-only'

import {
  createTRPCOptionsProxy,
  type TRPCQueryOptions,
} from '@trpc/tanstack-react-query'
import {createTRPCClient} from '@wingriders/rapid-dex-sdk-core'
import type {TRPC} from '@wingriders/rapid-dex-sdk-react'
import {cache} from 'react'
import {env} from '@/config'
import {makeQueryClient} from './query-client'

export const getQueryClient = cache(makeQueryClient)

let serverTrpc: TRPC | undefined

export const getServerTrpc = () => {
  if (!serverTrpc)
    serverTrpc = createTRPCOptionsProxy({
      client: createTRPCClient({
        type: 'server',
        serverUrl: env('SERVER_URL'),
      }),
      queryClient: getQueryClient,
    })
  return serverTrpc
}

export const prefetchQuery = async <
  T extends ReturnType<TRPCQueryOptions<any>>,
>(
  queryOptions: T,
) => {
  const queryClient = getQueryClient()
  if (queryOptions.queryKey[1]?.type === 'infinite') {
    await queryClient.prefetchInfiniteQuery(queryOptions as any)
  } else {
    await queryClient.prefetchQuery(queryOptions)
  }
}
