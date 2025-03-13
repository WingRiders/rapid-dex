import pino from 'pino'
import {config} from './config'
export const logger: pino.Logger = pino({
  name: 'rapid-dex-backend',
  level: 'info',
  ...(config.NODE_ENV !== 'production'
    ? {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
          },
        },
      }
    : {}),
})
