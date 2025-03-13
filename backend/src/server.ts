import {createHTTPServer} from '@trpc/server/adapters/standalone'
import {appRouter} from './appRouter'
import {config} from './config'
import {logger} from './logger'

export const startServer = () => {
  createHTTPServer({
    router: appRouter,
  }).listen(config.SERVER_PORT)
  logger.info(`Running server on port ${config.SERVER_PORT}`)
}
