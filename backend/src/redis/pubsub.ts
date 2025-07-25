import SuperJSON from 'superjson'
import type {TaggedUnion} from 'type-fest'
import type {AssetsAdaExchangeRates} from '../helpers/exchangeRates'
import type {InteractionUpdatedPayload} from '../interactionsUpdates'
import {logger} from '../logger'
import type {MempoolPoolOutputs} from '../ogmios/mempoolCache'
import type {
  PoolCreatedPayload,
  PoolRolledBackPayload,
  PoolStateUpdatedPayload,
  PoolUtxoUpdatedPayload,
} from '../poolsUpdates'
import {getRedisClient} from './client'

export enum PubSubChannel {
  POOL_STATE_UPDATED = 'poolStateUpdated',
  POOL_UTXO_UPDATED = 'poolUtxoUpdated',
  POOL_CREATED = 'poolCreated',
  POOL_ROLLED_BACK = 'poolRolledBack',
  MEMPOOL_POOL_OUTPUTS_UPDATED = 'mempoolPoolOutputsUpdated',
  INTERACTION_UPDATED = 'interactionUpdated',
  ASSETS_ADA_EXCHANGE_RATES_UPDATED = 'assetsAdaExchangeRatesUpdated',
}

export type PubSubPayloads = {
  [PubSubChannel.POOL_STATE_UPDATED]: PoolStateUpdatedPayload
  [PubSubChannel.POOL_UTXO_UPDATED]: PoolUtxoUpdatedPayload
  [PubSubChannel.POOL_CREATED]: PoolCreatedPayload
  [PubSubChannel.POOL_ROLLED_BACK]: PoolRolledBackPayload
  [PubSubChannel.MEMPOOL_POOL_OUTPUTS_UPDATED]: {
    // This data is already being stored in the Redis as a simple value
    // so in theory, this pubsub payload could be just a flag that the data changed.
    // But it's faster to just send the data instead of server having to read it from Redis upon receiving the message.
    poolOutputs: MempoolPoolOutputs
  }
  [PubSubChannel.INTERACTION_UPDATED]: InteractionUpdatedPayload
  [PubSubChannel.ASSETS_ADA_EXCHANGE_RATES_UPDATED]: {
    assetsAdaExchangeRates: AssetsAdaExchangeRates
  }
}

export const publishToPubSub = async <TChannel extends PubSubChannel>(
  channel: TChannel,
  message: PubSubPayloads[TChannel],
) => {
  const serializedMessage = SuperJSON.stringify(message)
  try {
    await getRedisClient().publish(channel, serializedMessage)
  } catch (e: any) {
    logger.error(
      `Error when publishing to redis channel ${channel}: ${e.message}`,
    )
  }
}

export const subscribeToPubSub = async <TSubChannel extends PubSubChannel>(
  channels: TSubChannel[],
  onReceivedMessage: (
    payload: TaggedUnion<'channel', Pick<PubSubPayloads, TSubChannel>>,
  ) => void | Promise<void>,
) => {
  try {
    await getRedisClient().subscribe(...channels)
  } catch (e: any) {
    logger.error(
      `Error when subscribing to redis channels ${channels}: ${e.message}`,
    )
  }

  getRedisClient().on(
    'message',
    async (channel: TSubChannel, message: string) => {
      if (channels.includes(channel)) {
        try {
          const parsedMessage = SuperJSON.parse(
            message,
          ) as PubSubPayloads[TSubChannel]
          await onReceivedMessage({channel, ...parsedMessage})
        } catch (e: any) {
          logger.error(
            `Error when handling message from redis channel ${channel}: ${e.message}`,
          )
        }
      }
    },
  )
}
