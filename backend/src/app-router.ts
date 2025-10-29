import {initTRPC, tracked} from '@trpc/server'
import type {RouterRecord} from '@trpc/server/unstable-core-do-not-import'
import {augmentSuperJSON} from '@wingriders/rapid-dex-common'
import superjson from 'superjson'
import {z} from 'zod'
import {getDailyActiveUsers} from './endpoints/daily-active-users'
import {
  getAggregatorHealthcheck,
  getBothModeHealthcheck,
  getServerHealthcheck,
} from './endpoints/healthcheck'
import {
  getPoolInteractions,
  getUserInteractions,
} from './endpoints/interactions'
import {getPoolUtxo} from './endpoints/pool'
import {getPools} from './endpoints/pools'
import {getTokenMetadata, getTokensMetadata} from './endpoints/token-metadata'
import {getTvl} from './endpoints/tvl'
import {getPoolsVolume, getVolume} from './endpoints/volume'
import {interactionsUpdatesEventEmitterIterable} from './interactions-updates'
import {submitTx} from './ogmios/tx-submission-client'
import {poolsUpdatesEventEmitterIterable} from './pools-updates'

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
    userInteractions: publicProcedure
      .input(
        z.object({
          stakeKeyHash: z.string(),
          onlyUnconfirmed: z.boolean().optional(),
        }),
      )
      .query(({input}) =>
        getUserInteractions(input.stakeKeyHash, input.onlyUnconfirmed),
      ),
    poolInteractions: publicProcedure
      .input(z.object({shareAssetName: z.string()}))
      .query(({input}) => getPoolInteractions(input.shareAssetName)),
    tvl: publicProcedure.query(getTvl),
    volume: publicProcedure
      .input(z.object({hoursOffset: z.number()}))
      .query(({input}) => getVolume(input.hoursOffset)),
    poolsVolume: publicProcedure
      .input(z.object({hoursOffset: z.number()}))
      .query(({input}) => getPoolsVolume(input.hoursOffset)),
    dailyActiveUsers: publicProcedure.query(getDailyActiveUsers),
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
    onUserInteractionsUpdate: publicProcedure
      .input(z.object({stakeKeyHash: z.string()}))
      .subscription(async function* (opts) {
        for await (const [payload] of interactionsUpdatesEventEmitterIterable(
          'interactionUpdated',
          {signal: opts.signal},
        )) {
          if (payload.stakeKeyHash === opts.input.stakeKeyHash) {
            yield tracked(payload.interaction.txHash, payload.interaction)
          }
        }
      }),
    onPoolInteractionsUpdate: publicProcedure
      .input(z.object({poolShareAssetName: z.string()}))
      .subscription(async function* (opts) {
        for await (const [payload] of interactionsUpdatesEventEmitterIterable(
          'interactionUpdated',
          {signal: opts.signal},
        )) {
          if (
            payload.interaction.pool.shareAssetName ===
            opts.input.poolShareAssetName
          ) {
            yield tracked(payload.interaction.txHash, payload.interaction)
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
