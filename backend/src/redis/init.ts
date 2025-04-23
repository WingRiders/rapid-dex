import {setMempoolPoolOutputs} from '../ogmios/mempoolCache'
import {
  emitPoolCreated,
  emitPoolRolledBack,
  emitPoolStateUpdated,
  emitPoolUtxoUpdated,
} from '../poolsUpdates'
import {emitTxsAddedToBlock} from '../txsListener'
import {PubSubChannel, subscribeToPubSub} from './pubsub'

export const initRedisSubscriptions = async () => {
  await subscribeToPubSub(
    [
      PubSubChannel.TXS_ADDED_TO_BLOCK,
      PubSubChannel.POOL_STATE_UPDATED,
      PubSubChannel.POOL_UTXO_UPDATED,
      PubSubChannel.POOL_CREATED,
      PubSubChannel.POOL_ROLLED_BACK,
      PubSubChannel.MEMPOOL_POOL_OUTPUTS_UPDATED,
    ],
    (payload) => {
      if (payload.channel === PubSubChannel.TXS_ADDED_TO_BLOCK) {
        emitTxsAddedToBlock(payload)
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
      if (payload.channel === PubSubChannel.MEMPOOL_POOL_OUTPUTS_UPDATED) {
        setMempoolPoolOutputs(payload.poolOutputs)
      }
    },
  )
}
