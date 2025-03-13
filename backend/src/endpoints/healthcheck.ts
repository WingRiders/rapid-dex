import {prisma} from '@/db/prismaClient'
import {originPoint} from '@/helpers'
import {getLedgerTip, getNetworkTip} from '@/ogmios/ledgerStateQuery'
import type {Point} from '@cardano-ogmios/schema'
import {TRPCError} from '@trpc/server'

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
  const healthy =
    networkSlot - ledgerSlot < healthyThresholdSlot &&
    ledgerSlot - lastBlockSlot < healthyThresholdSlot
  if (!healthy) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Healthcheck failed: lastBlockSlot = ${lastBlockSlot}, ledgerSlot = ${ledgerSlot}, networkSlot = ${networkSlot}`,
    })
  }
  return {
    healthy,
    networkSlot,
    ledgerSlot,
    lastBlockSlot,
    isDbConnected,
    isOgmiosConnected,
    uptime: process.uptime(),
  }
}
