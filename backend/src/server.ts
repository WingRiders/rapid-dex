import {handleTokenImageRequest} from '@/endpoints/tokenImage'
import type {BunRequest} from 'bun'
import {createBunHttpHandler} from 'trpc-bun-adapter'
import {aggregatorAppRouter, serverAppRouter} from './appRouter'
import {config} from './config'
import {logger} from './logger'

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
      '/token-image/:subject': (req: BunRequest<'/token-image/:subject'>) =>
        handleTokenImageRequest(req.params.subject),
    },
    fetch(request, response) {
      return (
        trpcHandler(request, response) ??
        new Response('Not found', {status: 404})
      )
    },
  })

  logger.info(`Running server on port ${config.SERVER_PORT}`)
}
