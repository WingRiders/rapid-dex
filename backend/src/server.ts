import type {BunRequest} from 'bun'
import {createBunHttpHandler} from 'trpc-bun-adapter'
import {aggregatorAppRouter, serverAppRouter} from './appRouter'
import {config} from './config'
import {handleTokenImageRequest} from './endpoints/tokenImage'
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
      '/token-image/:unit': (req: BunRequest<'/token-image/:unit'>) =>
        handleTokenImageRequest(req.params.unit),
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
