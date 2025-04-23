'use client'

import {env} from '@/config'
import {
  type QueryClient,
  QueryClientProvider,
  isServer,
} from '@tanstack/react-query'
import {ReactQueryDevtools} from '@tanstack/react-query-devtools'
import {
  createTRPCClient,
  createWSClient,
  httpBatchStreamLink,
  splitLink,
  wsLink,
} from '@trpc/client'
import type {ServerAppRouter} from '@wingriders/rapid-dex-backend/src/appRouter'
import {useState} from 'react'
import SuperJSON from 'superjson'
import {TRPCProvider} from '../trpc/client'
import {makeQueryClient} from '../trpc/query-client'

let browserQueryClient: QueryClient | undefined = undefined

const wsClient: ReturnType<typeof createWSClient> | undefined = isServer
  ? undefined
  : createWSClient({
      url: env('NEXT_PUBLIC_SERVER_URL'),
    })

const getQueryClient = () => {
  if (isServer) {
    // Server: always make a new query client
    return makeQueryClient()
  }
  // Browser: make a new query client if we don't already have one
  if (!browserQueryClient) browserQueryClient = makeQueryClient()
  return browserQueryClient
}

export const QueryProvider = ({children}: {children: React.ReactNode}) => {
  const queryClient = getQueryClient()

  const [trpcClient] = useState(() =>
    createTRPCClient<ServerAppRouter>({
      links: [
        splitLink({
          condition: (op) => op.type === 'subscription' && !!wsClient,
          true: wsLink({
            client: wsClient!,
            transformer: SuperJSON,
          }),
          false: httpBatchStreamLink({
            url: env('NEXT_PUBLIC_SERVER_URL'),
            transformer: SuperJSON,
          }),
        }),
      ],
    }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {children}
      </TRPCProvider>
      {env('NEXT_PUBLIC_ENABLE_REACT_QUERY_DEVTOOLS') && <ReactQueryDevtools />}
    </QueryClientProvider>
  )
}
