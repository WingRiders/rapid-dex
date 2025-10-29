import {createServer} from 'node:http'
import {createHTTPHandler} from '@trpc/server/adapters/standalone'
import {applyWSSHandler} from '@trpc/server/adapters/ws'
import cors from 'cors'
import {WebSocketServer} from 'ws'
import {
  createAggregatorRouter,
  createBothModeRouter,
  createServerRouter,
} from './app-router'
import {config, isProd, isServerMode} from './config'
import {handleTokenImageRequest} from './endpoints/token-image'
import {getCorsOptions} from './helpers/cors'
import {logger} from './logger'

export const startServer = () => {
  const router = {
    aggregator: createAggregatorRouter(),
    server: createServerRouter(),
    both: createBothModeRouter(),
  }[config.MODE]

  const trpcHandler = createHTTPHandler({
    router,
    middleware: config.CORS_ENABLED_FOR
      ? cors(getCorsOptions(config.CORS_ENABLED_FOR, isProd))
      : undefined,
  })

  // HTTP server
  const server = createServer((req, res) => {
    if (isServerMode) {
      if (req.url?.match(/^\/token-image\/.+$/)) {
        handleTokenImageRequest(req.url.split('/').pop()!, res)
      }
    }

    trpcHandler(req, res)
  })

  if (isServerMode) {
    // WebSocket server
    const wss = new WebSocketServer({server})
    applyWSSHandler({
      wss,
      router,
    })
  }

  server.listen(config.SERVER_PORT)

  logger.info(`Server is running on port ${config.SERVER_PORT}`)
}
