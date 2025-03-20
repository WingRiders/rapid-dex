import {initTRPC} from '@trpc/server'
import {augmentSuperJSON} from '@wingriders/rapid-dex-common'
import superjson from 'superjson'
import {z} from 'zod'
import {healthcheck} from './endpoints/healthcheck'
import {getPoolUtxo} from './endpoints/pool'
import {getPools} from './endpoints/pools'
import {getTokenMetadata, getTokensMetadata} from './endpoints/tokenMetadata'

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
})

// export type definition of API
export type ServerAppRouter = typeof serverAppRouter
