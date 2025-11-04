'use client'

import {
  isServer,
  type QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import {ReactQueryDevtools} from '@tanstack/react-query-devtools'
import {createTRPCClient} from '@wingriders/rapid-dex-sdk-core'
import {TRPCProvider} from '@wingriders/rapid-dex-sdk-react'
import {useState} from 'react'
import {env} from '@/config'
import {makeQueryClient} from '../trpc/query-client'

let browserQueryClient: QueryClient | undefined

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
    createTRPCClient({
      type: 'browser',
      serverUrl: env('NEXT_PUBLIC_SERVER_URL'),
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
