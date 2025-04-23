import {initTRPC} from '@trpc/server'
import type {RouterRecord} from '@trpc/server/unstable-core-do-not-import'
import {augmentSuperJSON} from '@wingriders/rapid-dex-common'
import superjson from 'superjson'
import {z} from 'zod'
import {
  getAggregatorHealthcheck,
  getBothModeHealthcheck,
  getServerHealthcheck,
} from './endpoints/healthcheck'
import {getPoolUtxo} from './endpoints/pool'
import {getPools} from './endpoints/pools'
import {getTokenMetadata, getTokensMetadata} from './endpoints/tokenMetadata'
import {isPoolTxInBlock} from './endpoints/transaction'
import {submitTx} from './ogmios/txSubmissionClient'
import {poolsUpdatesEventEmitterIterable} from './poolsUpdates'
import {txsListenerEmitterIterable} from './txsListener'

augmentSuperJSON()

export const t = initTRPC.create({transformer: superjson})
export const publicProcedure = t.procedure
export const mergeRouters = t.mergeRouters

export const createAggregatorRouter = () =>
  t.router({
    healthcheck: publicProcedure.query(getAggregatorHealthcheck),
  })

export const createServerRouter = () =>
  t.router({
    submitTx: publicProcedure
      .input(z.string())
      .mutation(({input}) => submitTx(input)),
    healthcheck: publicProcedure.query(getServerHealthcheck),
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
    onTxsAddedToBlock: publicProcedure
      .input(z.object({txHashes: z.array(z.string())}))
      .subscription(async function* (opts) {
        for await (const [{txHashes}] of txsListenerEmitterIterable(
          'txsAddedToBlock',
          {signal: opts.signal},
        )) {
          const filteredTxHashes = txHashes.filter((txHash) =>
            opts.input.txHashes.includes(txHash),
          )

          if (filteredTxHashes.length > 0) {
            yield filteredTxHashes
          }
        }
      }),
  })

const omitHealthcheck = <T extends RouterRecord>(
  procedures: T,
): Omit<T, 'healthcheck'> =>
  Object.fromEntries(
    Object.entries(procedures).filter(([key]) => key !== 'healthcheck'),
  ) as Omit<T, 'healthcheck'>

export const createBothModeRouter = () =>
  mergeRouters(
    t.router(omitHealthcheck(createAggregatorRouter()._def.procedures)),
    t.router(omitHealthcheck(createServerRouter()._def.procedures)),
    t.router({
      healthcheck: publicProcedure.query(getBothModeHealthcheck),
    }),
  )

// export type definition of API
export type ServerAppRouter = ReturnType<typeof createServerRouter>
