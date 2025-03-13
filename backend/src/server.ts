import {createHTTPServer} from '@trpc/server/adapters/standalone'
import {aggregatorAppRouter, serverAppRouter} from './appRouter'
import {config} from './config'
import {logger} from './logger'

export const startServer = () => {
  createHTTPServer({
    router:
      config.MODE === 'aggregator' ? aggregatorAppRouter : serverAppRouter,
  }).listen(config.SERVER_PORT)
  logger.info(`Running server on port ${config.SERVER_PORT}`)
}
