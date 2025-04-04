import {TRPCError} from '@trpc/server'
import {prisma} from '../db/prismaClient'
import {tipToSlot} from '../helpers'
import {getLedgerTip, getNetworkTip} from '../ogmios/ledgerStateQuery'
import {isTokenMetadataFetched as isTokenMetadataFetchedFn} from '../tokenRegistry'

const IS_DB_SYNCED_THRESHOLD_SLOTS = 300 // 5 minutes

const getAggregatorHealthStatus = async () => {
  const lastBlockPromise = prisma.block.findFirst({orderBy: [{slot: 'desc'}]})
  const networkTipPromise = getNetworkTip()
  const [
    networkSlot,
    ledgerSlot,
    lastBlockSlot,
    isDbConnected,
    isOgmiosConnected,
  ] = await Promise.all([
    networkTipPromise.then(tipToSlot).catch(() => 0),
    getLedgerTip()
      .then(tipToSlot)
      .catch(() => 0),
    lastBlockPromise.then((block) => (block ? block.slot : 0)).catch(() => 0),
    lastBlockPromise.then(() => true).catch(() => false),
    networkTipPromise.then(() => true).catch(() => false),
  ])

  const isDbSynced =
    networkSlot - ledgerSlot < IS_DB_SYNCED_THRESHOLD_SLOTS &&
    ledgerSlot - lastBlockSlot < IS_DB_SYNCED_THRESHOLD_SLOTS

  const healthy = isDbConnected && isDbSynced && isOgmiosConnected

  return {
    healthy,
    networkSlot,
    ledgerSlot,
    lastBlockSlot,
    isDbConnected,
    isDbSynced,
    isOgmiosConnected,
    uptime: process.uptime(),
  }
}

export const getAggregatorHealthcheck = async () => {
  const healthStatus = await getAggregatorHealthStatus()

  if (!healthStatus.healthy) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Healthcheck failed: ${JSON.stringify(healthStatus)}`,
    })
  }

  return healthStatus
}

const getServerHealthStatus = async () => {
  const isDbConnected = await prisma.block
    .findFirst({
      orderBy: [{slot: 'desc'}],
    })
    .then(() => true)
    .catch(() => false)
  const isTokenMetadataFetched = isTokenMetadataFetchedFn()

  const healthy = isDbConnected && isTokenMetadataFetched

  return {
    healthy,
    isDbConnected,
    isTokenMetadataFetched,
    uptime: process.uptime(),
  }
}
export const getServerHealthcheck = async () => {
  const healthStatus = await getServerHealthStatus()

  if (!healthStatus.healthy) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Healthcheck failed: ${JSON.stringify(healthStatus)}`,
    })
  }

  return healthStatus
}

export const getBothModeHealthcheck = async () => {
  const [aggregatorHealthStatus, serverHealthStatus] = await Promise.all([
    getAggregatorHealthStatus(),
    getServerHealthStatus(),
  ])

  const healthStatus = {
    ...aggregatorHealthStatus,
    ...serverHealthStatus,
    healthy: aggregatorHealthStatus.healthy && serverHealthStatus.healthy,
  }

  if (!healthStatus.healthy) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Healthcheck failed: ${JSON.stringify(healthStatus)}`,
    })
  }

  return healthStatus
}
