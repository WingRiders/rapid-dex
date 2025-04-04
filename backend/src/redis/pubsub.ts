import SuperJSON from 'superjson'
import type {TaggedUnion} from 'type-fest'
import {logger} from '../logger'
import type {
  PoolCreatedPayload,
  PoolRolledBackPayload,
  PoolStateUpdatedPayload,
  PoolUtxoUpdatedPayload,
} from '../poolsUpdates'
import type {TxAddedToBlockPayload} from '../txsListener'
import {getRedisClient} from './client'

export enum PubSubChannel {
  TX_ADDED_TO_BLOCK = 'txAddedToBlock',
  POOL_STATE_UPDATED = 'poolStateUpdated',
  POOL_UTXO_UPDATED = 'poolUtxoUpdated',
  POOL_CREATED = 'poolCreated',
  POOL_ROLLED_BACK = 'poolRolledBack',
}

export type PubSubPayloads = {
  [PubSubChannel.TX_ADDED_TO_BLOCK]: TxAddedToBlockPayload
  [PubSubChannel.POOL_STATE_UPDATED]: PoolStateUpdatedPayload
  [PubSubChannel.POOL_UTXO_UPDATED]: PoolUtxoUpdatedPayload
  [PubSubChannel.POOL_CREATED]: PoolCreatedPayload
  [PubSubChannel.POOL_ROLLED_BACK]: PoolRolledBackPayload
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
