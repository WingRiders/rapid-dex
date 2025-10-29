import {emitInteractionUpdated} from '../interactions-updates'
import {setAssetsAdaExchangeRates} from '../ogmios/exchange-rates-cache'
import {setMempoolPoolOutputs} from '../ogmios/mempool-cache'
import {
  emitPoolCreated,
  emitPoolRolledBack,
  emitPoolStateUpdated,
  emitPoolUtxoUpdated,
} from '../pools-updates'
import {PubSubChannel, subscribeToPubSub} from './pubsub'

export const initRedisSubscriptions = async () => {
  await subscribeToPubSub(
    [
      PubSubChannel.POOL_STATE_UPDATED,
      PubSubChannel.POOL_UTXO_UPDATED,
      PubSubChannel.POOL_CREATED,
      PubSubChannel.POOL_ROLLED_BACK,
      PubSubChannel.MEMPOOL_POOL_OUTPUTS_UPDATED,
      PubSubChannel.INTERACTION_UPDATED,
      PubSubChannel.ASSETS_ADA_EXCHANGE_RATES_UPDATED,
    ],
    (payload) => {
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
      if (payload.channel === PubSubChannel.INTERACTION_UPDATED) {
        emitInteractionUpdated(payload)
      }
      if (payload.channel === PubSubChannel.ASSETS_ADA_EXCHANGE_RATES_UPDATED) {
        setAssetsAdaExchangeRates(payload.assetsAdaExchangeRates)
      }
    },
  )
}
