import 'server-only'

import {createTRPCClient, httpBatchLink} from '@trpc/client'
import {
  createTRPCOptionsProxy,
  type TRPCQueryOptions,
} from '@trpc/tanstack-react-query'
import type {ServerAppRouter} from '@wingriders/rapid-dex-backend/src/appRouter'
import {augmentSuperJSON} from '@wingriders/rapid-dex-common'
import {cache} from 'react'
import SuperJSON from 'superjson'
import {env} from '@/config'
import type {TRPC} from './client'
import {makeQueryClient} from './query-client'

augmentSuperJSON()

export const getQueryClient = cache(makeQueryClient)

let serverTrpc: TRPC | undefined

export const getServerTrpc = () => {
  if (!serverTrpc)
    serverTrpc = createTRPCOptionsProxy({
      client: createTRPCClient<ServerAppRouter>({
        links: [
          httpBatchLink({
            url: env('SERVER_URL'),
            transformer: SuperJSON,
          }),
        ],
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
