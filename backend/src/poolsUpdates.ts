import EventEmitter, {on} from 'node:events'
import type {UTxO} from '@meshsdk/core'
import type {PoolState} from '@wingriders/rapid-dex-common'
import {dbPoolOutputToPoolState, dbPoolOutputToUtxo} from './db/helpers'
import {prisma} from './db/prismaClient'
import type {getPools} from './endpoints/pools'

type PoolStateUpdatedPayload = {
  shareAssetName: string
  poolState: PoolState
  validAt: Date
}

type PoolUtxoUpdatedPayload = {
  shareAssetName: string
  utxo: UTxO
  validAt: Date
}

type PoolCreatedPayload = {
  pool: Awaited<ReturnType<typeof getPools>>[number]
}

type PoolRolledBackPayload = {
  shareAssetName: string
  validAt: Date
}

type PoolsUpdatesEvents = {
  poolStateUpdated: [payload: PoolStateUpdatedPayload]
  poolUtxoUpdated: [payload: PoolUtxoUpdatedPayload]
  poolCreated: [payload: PoolCreatedPayload]
  poolRolledBack: [payload: PoolRolledBackPayload]
}

const poolsUpdatesEventEmitter = new EventEmitter<PoolsUpdatesEvents>()
poolsUpdatesEventEmitter.setMaxListeners(Number.MAX_SAFE_INTEGER)

export const emitPoolStateUpdated = (payload: PoolStateUpdatedPayload) => {
  poolsUpdatesEventEmitter.emit('poolStateUpdated', payload)
}

export const emitPoolUtxoUpdated = (payload: PoolUtxoUpdatedPayload) => {
  poolsUpdatesEventEmitter.emit('poolUtxoUpdated', payload)
}

export const emitPoolCreated = (payload: PoolCreatedPayload) => {
  poolsUpdatesEventEmitter.emit('poolCreated', payload)
}

export const emitPoolRolledBack = (payload: PoolRolledBackPayload) => {
  poolsUpdatesEventEmitter.emit('poolRolledBack', payload)
}

export const poolsUpdatesEventEmitterIterable = <
  TEventName extends keyof PoolsUpdatesEvents,
>(
  eventName: TEventName,
  options?: Parameters<typeof on>[2],
): AsyncIterable<PoolsUpdatesEvents[TEventName]> =>
  on(poolsUpdatesEventEmitter, eventName, options) as any

export const emitPoolUpdatesOnRollback = async (rollbackSlot: number) => {
  const affectedPoolOutputs = await prisma.poolOutput.findMany({
    select: {
      shareAssetName: true,
    },
    distinct: ['shareAssetName'],
    where: {
      slot: {
        gt: rollbackSlot,
      },
    },
  })

  for (const affectedPoolOutput of affectedPoolOutputs) {
    const validAt = new Date()

    const lastValidPoolOutput = await prisma.poolOutput.findFirst({
      where: {
        shareAssetName: affectedPoolOutput.shareAssetName,
        slot: {
          lte: rollbackSlot,
        },
      },
      orderBy: [
        {
          slot: 'desc',
        },
        {
          spendSlot: 'desc',
        },
      ],
      select: {
        shareAssetName: true,
        assetAPolicy: true,
        assetAName: true,
        assetBPolicy: true,
        assetBName: true,
        lpts: true,
        qtyA: true,
        qtyB: true,
        swapFeePoints: true,
        feeBasis: true,
        utxoId: true,
        assets: true,
        coins: true,
        datumCBOR: true,
        address: true,
      },
    })

    if (lastValidPoolOutput) {
      emitPoolStateUpdated({
        shareAssetName: affectedPoolOutput.shareAssetName,
        poolState: dbPoolOutputToPoolState(lastValidPoolOutput),
        validAt,
      })
      emitPoolUtxoUpdated({
        shareAssetName: affectedPoolOutput.shareAssetName,
        utxo: dbPoolOutputToUtxo(lastValidPoolOutput),
        validAt,
      })
    } else {
      emitPoolRolledBack({
        shareAssetName: affectedPoolOutput.shareAssetName,
        validAt,
      })
    }
  }
}
