import {
  isAggregatorMode,
  isOnlyAggregatorMode,
  isOnlyServerMode,
  isServerMode,
} from './config'
import {ensureDBMigrated} from './db/migrate-db'
import {startChainSyncClient} from './ogmios/chain-sync'
import {initAssetAdaExchangeRatesCache} from './ogmios/exchange-rates-cache'
import {startMempoolMonitoring} from './ogmios/mempool'
import {initMempoolCacheFromRedis} from './ogmios/mempool-cache'
import {getOgmiosContext} from './ogmios/ogmios'
import {initializeTxSubmissionClient} from './ogmios/tx-submission-client'
import {initRedisClient} from './redis/client'
import {initRedisSubscriptions} from './redis/init'
import {startServer} from './server'
import {tokensMetadataLoop} from './token-registry'

if (isOnlyServerMode || isOnlyAggregatorMode) {
  initRedisClient()
}

if (isOnlyServerMode) {
  await initMempoolCacheFromRedis()
  await initAssetAdaExchangeRatesCache()
  // Init PubSub only in the server mode (not in the both mode).
  // We don't need it in the both mode because the events are emitted directly.
  await initRedisSubscriptions()
}

await getOgmiosContext()

if (isAggregatorMode) {
  await ensureDBMigrated()

  startChainSyncClient()
  startMempoolMonitoring()
}

if (isServerMode) {
  tokensMetadataLoop()
  initializeTxSubmissionClient()
}

startServer()
