import {
  isAggregatorMode,
  isOnlyAggregatorMode,
  isOnlyServerMode,
  isServerMode,
} from './config'
import {ensureDBMigrated} from './db/migrateDb'
import {startChainSyncClient} from './ogmios/chainSync'
import {startMempoolMonitoring} from './ogmios/mempool'
import {initMempoolCacheFromRedis} from './ogmios/mempoolCache'
import {getOgmiosContext} from './ogmios/ogmios'
import {initializeTxSubmissionClient} from './ogmios/txSubmissionClient'
import {initRedisClient} from './redis/client'
import {initRedisSubscriptions} from './redis/init'
import {startServer} from './server'
import {tokensMetadataLoop} from './tokenRegistry'

if (isOnlyServerMode || isOnlyAggregatorMode) {
  initRedisClient()
}

if (isOnlyServerMode) {
  await initMempoolCacheFromRedis()
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
