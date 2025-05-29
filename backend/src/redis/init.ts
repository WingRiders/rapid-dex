import {setAssetsAdaExchangeRates} from '../ogmios/exchangeRatesCache'
import {setMempoolPoolOutputs} from '../ogmios/mempoolCache'
import {
  emitPoolCreated,
  emitPoolRolledBack,
  emitPoolStateUpdated,
  emitPoolUtxoUpdated,
} from '../poolsUpdates'
import {PubSubChannel, subscribeToPubSub} from './pubsub'

export const initRedisSubscriptions = async () => {
  await subscribeToPubSub(
    [
      PubSubChannel.POOL_STATE_UPDATED,
      PubSubChannel.POOL_UTXO_UPDATED,
      PubSubChannel.POOL_CREATED,
      PubSubChannel.POOL_ROLLED_BACK,
      PubSubChannel.MEMPOOL_POOL_OUTPUTS_UPDATED,
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
      if (payload.channel === PubSubChannel.ASSETS_ADA_EXCHANGE_RATES_UPDATED) {
        setAssetsAdaExchangeRates(payload.assetsAdaExchangeRates)
      }
    },
  )
}
