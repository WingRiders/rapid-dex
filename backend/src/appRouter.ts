import {initTRPC} from '@trpc/server'
import {augmentSuperJSON} from '@wingriders/rapid-dex-common'
import superjson from 'superjson'
import {z} from 'zod'
import {healthcheck} from './endpoints/healthcheck'
import {getPoolUtxo} from './endpoints/pool'
import {getPools} from './endpoints/pools'
import {getTokenMetadata, getTokensMetadata} from './endpoints/tokenMetadata'
import {isPoolTxInBlock} from './endpoints/transaction'
import {poolsUpdatesEventEmitterIterable} from './poolsUpdates'
import {txsListenerEmitterIterable} from './txsListener'

augmentSuperJSON()

export const t = initTRPC.create({transformer: superjson})
export const publicProcedure = t.procedure

export const aggregatorAppRouter = t.router({
  healthcheck: publicProcedure.query(healthcheck),
})

export const serverAppRouter = t.router({
  healthcheck: publicProcedure.query(healthcheck),
  pools: publicProcedure.query(getPools),
  poolUtxo: publicProcedure
    .input(z.object({shareAssetName: z.string()}))
    .query(({input}) => getPoolUtxo(input.shareAssetName)),
  // using mutation instead of query because the input can be too large for a GET request
  tokensMetadata: publicProcedure
    .input(z.array(z.string()))
    .mutation(({input}) => getTokensMetadata(input)),
  tokenMetadata: publicProcedure
    .input(z.string())
    .query(({input}) => getTokenMetadata(input)),
  isPoolTxInBlock: publicProcedure
    .input(z.object({txHash: z.string()}))
    .query(({input}) => isPoolTxInBlock(input.txHash)),
  onPoolStateUpdated: publicProcedure.subscription(async function* (opts) {
    for await (const [payload] of poolsUpdatesEventEmitterIterable(
      'poolStateUpdated',
      {signal: opts.signal},
    )) {
      yield payload
    }
  }),
  onPoolUtxoUpdated: publicProcedure
    .input(z.object({shareAssetName: z.string()}))
    .subscription(async function* (opts) {
      for await (const [payload] of poolsUpdatesEventEmitterIterable(
        'poolUtxoUpdated',
        {signal: opts.signal},
      )) {
        if (payload.shareAssetName === opts.input.shareAssetName) {
          yield payload
        }
      }
    }),
  onPoolCreated: publicProcedure.subscription(async function* (opts) {
    for await (const [payload] of poolsUpdatesEventEmitterIterable(
      'poolCreated',
      {signal: opts.signal},
    )) {
      yield payload
    }
  }),
  onPoolRolledBack: publicProcedure.subscription(async function* (opts) {
    for await (const [payload] of poolsUpdatesEventEmitterIterable(
      'poolRolledBack',
      {signal: opts.signal},
    )) {
      yield payload
    }
  }),
  onTxAddedToBlock: publicProcedure
    .input(z.object({txHashes: z.set(z.string())}))
    .subscription(async function* (opts) {
      for await (const [txHash] of txsListenerEmitterIterable(
        'txAddedToBlock',
        {signal: opts.signal},
      )) {
        if (opts.input.txHashes.has(txHash)) {
          yield txHash
        }
      }
    }),
})

// export type definition of API
export type ServerAppRouter = typeof serverAppRouter
