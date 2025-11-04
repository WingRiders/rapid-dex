import {
  createTRPCClient as createTRPCClientFromTrpc,
  createWSClient,
  httpBatchLink,
  httpBatchStreamLink,
  splitLink,
  wsLink,
} from '@trpc/client'
import type {ServerAppRouter} from '@wingriders/rapid-dex-backend/src/app-router'
import {augmentSuperJSON} from '@wingriders/rapid-dex-common'
import SuperJSON from 'superjson'

type CreateTRPCClientOptions = {
  serverUrl: string
  type: 'browser' | 'server'
}

export const createTRPCClient = ({
  serverUrl,
  type,
}: CreateTRPCClientOptions) => {
  augmentSuperJSON()

  const wsClient: ReturnType<typeof createWSClient> | undefined =
    type === 'browser' && typeof window !== 'undefined'
      ? createWSClient({
          url: serverUrl,
        })
      : undefined

  const client =
    type === 'browser'
      ? createTRPCClientFromTrpc<ServerAppRouter>({
          links: [
            splitLink({
              condition: (op) => op.type === 'subscription' && !!wsClient,
              true: wsLink({
                client: wsClient!,
                transformer: SuperJSON,
              }),
              false: httpBatchStreamLink({
                url: serverUrl,
                transformer: SuperJSON,
              }),
            }),
          ],
        })
      : createTRPCClientFromTrpc<ServerAppRouter>({
          links: [
            httpBatchLink({
              url: serverUrl,
              transformer: SuperJSON,
            }),
          ],
        })

  return client
}

export type {ServerAppRouter}
