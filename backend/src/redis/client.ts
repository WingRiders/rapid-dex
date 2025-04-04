import {Redis} from 'ioredis'
import {config} from '../config'

let redis: Redis | undefined

export const initRedisClient = () => {
  if (!config.REDIS_URL) {
    throw new Error('Cannot create Redis client because REDIS_URL is not set')
  }

  redis = new Redis(config.REDIS_URL, {
    connectionName: 'rapid-dex-backend',
  })
}

export const getRedisClient = () => {
  if (!redis) {
    throw new Error('Redis client not initialized')
  }
  return redis
}
