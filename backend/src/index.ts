import {config} from '@/config'
import {logger} from '@/logger'
import {startChainSyncClient} from '@/ogmios/chainSync'
import {getOgmiosContext} from '@/ogmios/ogmios'
import {ensureDBMigrated} from './db/migrateDb'
import {startServer} from './server'

// First we need to get the Ogmios interaction context
// It's needed for both the chain synchronization client and the HTTP server
await getOgmiosContext()

if (['aggregator', 'both'].includes(config.MODE)) {
  logger.info('Migrating DB if necessary')
  await ensureDBMigrated()

  // Start the Ogmios chain synchronization client
  startChainSyncClient()
}

startServer()
