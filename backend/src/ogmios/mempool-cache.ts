import {isEmpty} from 'lodash'
import {isOnlyAggregatorMode} from '../config'
import type {PoolOutput} from '../db/prisma-client'
import {getRedisValue, RedisKey, setRedisValue} from '../redis/kv'
import {PubSubChannel, publishToPubSub} from '../redis/pubsub'

export type MempoolPoolOutput = Omit<
  PoolOutput,
  'slot' | 'spendSlot' | 'spendUtxoId' | 'txMetadata'
> & {
  // undefined if it's a new pool
  spentPoolInputUtxoId?: string
}

export type MempoolPoolOutputs = {
  [poolShareAssetName: string]: MempoolPoolOutput[]
}

let mempoolPoolOutputs: MempoolPoolOutputs = {}

export const initMempoolCacheFromRedis = async () => {
  const res = await getRedisValue(RedisKey.MEMPOOL_POOL_OUTPUTS)

  if (
    res &&
    // check if the current cache is still empty, so that we don't override it if it was already set
    isEmpty(mempoolPoolOutputs)
  ) {
    mempoolPoolOutputs = res.poolOutputs
  }
}

const handleCacheChanged = async () => {
  if (isOnlyAggregatorMode) {
    await Promise.all([
      publishToPubSub(PubSubChannel.MEMPOOL_POOL_OUTPUTS_UPDATED, {
        poolOutputs: mempoolPoolOutputs,
      }),
      // setting also as a Redis value so that the server can initialize the cache at the start
      setRedisValue(RedisKey.MEMPOOL_POOL_OUTPUTS, {
        poolOutputs: mempoolPoolOutputs,
      }),
    ])
  }
}

export const setMempoolPoolOutputs = (poolOutputs: MempoolPoolOutputs) => {
  mempoolPoolOutputs = poolOutputs
}

export const updateMempoolPoolOutputs = (poolOutputs: MempoolPoolOutputs) => {
  mempoolPoolOutputs = poolOutputs
  handleCacheChanged()
}

export const getMempoolPoolOutputs = () =>
  Object.values(mempoolPoolOutputs).flat()

export const getMempoolPoolOutputsForPool = (
  poolShareAssetName: string,
): MempoolPoolOutput[] | undefined => mempoolPoolOutputs[poolShareAssetName]

export const getMempoolPoolOutputsForStakeKeyHash = (
  stakeKeyHash: string,
): MempoolPoolOutput[] | undefined =>
  Object.values(mempoolPoolOutputs).flatMap((poolOutputs) =>
    poolOutputs.filter((o) => o.createdByStakeKeyHash === stakeKeyHash),
  )

export const updateMempoolPoolOutputsForPool = (
  poolShareAssetName: string,
  // if the function returns undefined, the pool outputs for the given poolShareAssetName will be deleted
  updateFn: (
    current: MempoolPoolOutput[] | undefined,
  ) => MempoolPoolOutput[] | undefined,
) => {
  const newPoolOutputs = updateFn(mempoolPoolOutputs[poolShareAssetName])
  if (newPoolOutputs == null) {
    delete mempoolPoolOutputs[poolShareAssetName]
  } else {
    mempoolPoolOutputs[poolShareAssetName] = newPoolOutputs
  }

  handleCacheChanged()
}

export const clearMempoolPoolOutputs = () => {
  mempoolPoolOutputs = {}
  handleCacheChanged()
}
