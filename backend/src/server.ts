import type {BunRequest} from 'bun'
import {createBunHttpHandler} from 'trpc-bun-adapter'
import {aggregatorAppRouter, serverAppRouter} from './appRouter'
import {config} from './config'
import {handleTokenImageRequest} from './endpoints/tokenImage'
import {logger} from './logger'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'OPTIONS, POST',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export const startServer = () => {
  const trpcHandler = createBunHttpHandler({
    endpoint: '',
    router:
      config.MODE === 'aggregator' ? aggregatorAppRouter : serverAppRouter,
    createContext: (_opts) => ({}),
  })

  Bun.serve({
    port: config.SERVER_PORT,
    routes: {
      '/token-image/:unit': (req: BunRequest<'/token-image/:unit'>) =>
        handleTokenImageRequest(req.params.unit),
    },
    async fetch(request, response) {
      if (request.method === 'OPTIONS')
        return new Response('Departed', {headers: CORS_HEADERS})

      const trpcResponse = await trpcHandler(request, response)
      if (!trpcResponse) return new Response('Not found', {status: 404})

      Object.entries(CORS_HEADERS).forEach(([key, value]) => {
        trpcResponse.headers.set(key, value)
      })
      return trpcResponse
    },
  })

  logger.info(`Running server on port ${config.SERVER_PORT}`)
}
