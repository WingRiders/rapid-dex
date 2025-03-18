'use client'

import {
  type QueryClient,
  QueryClientProvider,
  isServer,
} from '@tanstack/react-query'
import {createTRPCClient, httpBatchLink} from '@trpc/client'
import type {ServerAppRouter} from '@wingriders/rapid-dex-backend/src/appRouter'
import {useState} from 'react'
import SuperJSON from 'superjson'
import {config} from '../config'
import {TRPCProvider} from '../trpc/client'
import {makeQueryClient} from '../trpc/query-client'

let browserQueryClient: QueryClient | undefined = undefined

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
        httpBatchLink({
          url: config.NEXT_PUBLIC_SERVER_URL,
          transformer: SuperJSON,
        }),
      ],
    }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {children}
      </TRPCProvider>
    </QueryClientProvider>
  )
}
