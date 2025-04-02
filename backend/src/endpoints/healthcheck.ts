import type {Point} from '@cardano-ogmios/schema'
import {TRPCError} from '@trpc/server'
import {prisma} from '../db/prismaClient'
import {originPoint} from '../helpers'
import {getLedgerTip, getNetworkTip} from '../ogmios/ledgerStateQuery'
import {isTokenMetadataFetched as isTokenMetadataFetchedFn} from '../tokenRegistry'

export const healthcheck = async () => {
  const tipToSlot = (tip: Point | 'origin') =>
    tip === 'origin' ? originPoint.slot : tip.slot
  const lastBlockPromise = prisma.block.findFirst({
    orderBy: [{slot: 'desc'}],
  })
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
  const healthyThresholdSlot = 300 // 5 minutes
  const isTokenMetadataFetched = isTokenMetadataFetchedFn()

  const healthy =
    networkSlot - ledgerSlot < healthyThresholdSlot &&
    ledgerSlot - lastBlockSlot < healthyThresholdSlot &&
    isTokenMetadataFetched

  if (!healthy) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Healthcheck failed: lastBlockSlot = ${lastBlockSlot}, ledgerSlot = ${ledgerSlot}, networkSlot = ${networkSlot}, isTokenMetadataFetched = ${isTokenMetadataFetched}`,
    })
  }

  return {
    healthy,
    networkSlot,
    ledgerSlot,
    lastBlockSlot,
    isDbConnected,
    isOgmiosConnected,
    isTokenMetadataFetched,
    uptime: process.uptime(),
  }
}
