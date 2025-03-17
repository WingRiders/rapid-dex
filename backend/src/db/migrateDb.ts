import {secondsToMilliseconds} from 'date-fns'
import {config} from '../config'
import {logger} from '../logger'

// creates new database if absent and applies all migrations to the existing database.
export const migrateDb = async () => {
  // Currently we don't have any direct method to invoke prisma migration programmatically.
  // As a workaround, we spawn migration script as a child process and wait for its completion.
  // Please also refer to the following GitHub issue: https://github.com/prisma/prisma/issues/4703
  const exitCode = await new Promise((resolve, _) => {
    Bun.spawn(['bun', 'prisma migrate deploy'], {
      onExit(proc, exitCode, signalCode, error) {
        logger.info(proc.stdout)
        if (error != null) {
          logger.error(
            {stderr: proc.stderr, exitCode, signalCode},
            `bun prisma migrate deploy exited with error ${error.message}`,
          )
          resolve(exitCode ?? 1)
        } else {
          resolve(0)
        }
      },
    })
  })
  if (exitCode !== 0)
    throw new Error(`DB migration failed with exit code ${exitCode}`)
}

/**
 * Assume that in development the DB is migrated and managed by the 'dev' state
 */
let dbMigrated = config.NODE_ENV !== 'production'

export async function ensureDBMigrated() {
  if (dbMigrated) {
    logger.info('Skipping DB migration loop...')
    return
  }

  logger.info('Starting migration loop...')
  while (!dbMigrated) {
    try {
      await migrateDb()
      dbMigrated = true
    } catch (err) {
      logger.error(err, 'Unable to run migrations')
      await Bun.sleep(secondsToMilliseconds(30))
    }
  }
}

export function isDbMigrated() {
  return dbMigrated
}
