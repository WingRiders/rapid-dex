import {
  emitPoolCreated,
  emitPoolRolledBack,
  emitPoolStateUpdated,
  emitPoolUtxoUpdated,
} from '../poolsUpdates'
import {emitTxAddedToBlock} from '../txsListener'
import {PubSubChannel, subscribeToPubSub} from './pubsub'

export const initRedisSubscriptions = async () => {
  await subscribeToPubSub(
    [
      PubSubChannel.TX_ADDED_TO_BLOCK,
      PubSubChannel.POOL_STATE_UPDATED,
      PubSubChannel.POOL_UTXO_UPDATED,
      PubSubChannel.POOL_CREATED,
      PubSubChannel.POOL_ROLLED_BACK,
    ],
    (payload) => {
      if (payload.channel === PubSubChannel.TX_ADDED_TO_BLOCK) {
        emitTxAddedToBlock(payload)
      }
      if (payload.channel === PubSubChannel.POOL_CREATED) {
        emitPoolCreated(payload)
      }
      if (payload.channel === PubSubChannel.POOL_STATE_UPDATED) {
        emitPoolStateUpdated(payload)
      }
      if (payload.channel === PubSubChannel.POOL_UTXO_UPDATED) {
        emitPoolUtxoUpdated(payload)
      }
      if (payload.channel === PubSubChannel.POOL_ROLLED_BACK) {
        emitPoolRolledBack(payload)
      }
    },
  )
}
