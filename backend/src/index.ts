import {
  isAggregatorMode,
  isOnlyAggregatorMode,
  isOnlyServerMode,
  isServerMode,
} from './config'
import {ensureDBMigrated} from './db/migrateDb'
import {startChainSyncClient} from './ogmios/chainSync'
import {getOgmiosContext} from './ogmios/ogmios'
import {initRedisClient} from './redis/client'
import {initRedisSubscriptions} from './redis/init'
import {startServer} from './server'
import {tokensMetadataLoop} from './tokenRegistry'

if (isOnlyServerMode || isOnlyAggregatorMode) {
  initRedisClient()
}

if (isOnlyServerMode) {
  // Init PubSub only in the server mode (not in the both mode).
  // We don't need it in the both mode because the events are emitted directly.
  await initRedisSubscriptions()
}

if (isAggregatorMode) {
  await ensureDBMigrated()
  await getOgmiosContext()
  startChainSyncClient()
}

if (isServerMode) {
  tokensMetadataLoop()
}

startServer()
