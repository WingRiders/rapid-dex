import 'server-only'

import {createTRPCClient, httpBatchLink} from '@trpc/client'
import {
  type TRPCQueryOptions,
  createTRPCOptionsProxy,
} from '@trpc/tanstack-react-query'
import type {ServerAppRouter} from '@wingriders/rapid-dex-backend/src/appRouter'
import {augmentSuperJSON} from '@wingriders/rapid-dex-common'
import {cache} from 'react'
import SuperJSON from 'superjson'
import {config} from '../config'
import {makeQueryClient} from './query-client'

augmentSuperJSON()

export const getQueryClient = cache(makeQueryClient)

export const trpc = createTRPCOptionsProxy({
  client: createTRPCClient<ServerAppRouter>({
    links: [
      httpBatchLink({
        url: config.SERVER_URL,
        transformer: SuperJSON,
      }),
    ],
  }),
  queryClient: getQueryClient,
})

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
