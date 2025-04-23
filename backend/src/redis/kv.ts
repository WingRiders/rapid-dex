import SuperJSON from 'superjson'
import {logger} from '../logger'
import type {MempoolPoolOutputs} from '../ogmios/mempoolCache'
import {getRedisClient} from './client'

export enum RedisKey {
  MEMPOOL_POOL_OUTPUTS = 'mempoolPoolOutputs',
}

export type RedisValues = {
  [RedisKey.MEMPOOL_POOL_OUTPUTS]: {poolOutputs: MempoolPoolOutputs}
}

export const getRedisValue = async <TKey extends RedisKey>(
  key: TKey,
): Promise<RedisValues[TKey] | undefined> => {
  try {
    const res = await getRedisClient().get(key)
    return res ? SuperJSON.parse(res) : undefined
  } catch (e: any) {
    logger.error(
      `Error when getting value from redis with key ${key}: ${e.message}`,
    )
    return undefined
  }
}

export const setRedisValue = async <TKey extends RedisKey>(
  key: TKey,
  value: RedisValues[TKey],
) => {
  const serializedValue = SuperJSON.stringify(value)
  try {
    await getRedisClient().set(key, serializedValue)
  } catch (e: any) {
    logger.error(
      `Error when setting value in redis with key ${key}: ${e.message}`,
    )
  }
}
