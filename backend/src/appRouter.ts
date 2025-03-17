import {initTRPC} from '@trpc/server'
import BigNumber from 'bignumber.js'
import superjson from 'superjson'
import {z} from 'zod'
import {healthcheck} from './endpoints/healthcheck'
import {getPool} from './endpoints/pool'
import {getPools} from './endpoints/pools'
import {getTokenMetadata, getTokensMetadata} from './endpoints/tokenMetadata'

// Register BigNumber serialization with SuperJSON
superjson.registerCustom<BigNumber, string>(
  {
    isApplicable: (v) => BigNumber.isBigNumber(v),
    serialize: (v) => v.toString(),
    deserialize: (v) => new BigNumber(v),
  },
  'BigNumber',
)

export const t = initTRPC.create({transformer: superjson})
export const publicProcedure = t.procedure

export const aggregatorAppRouter = t.router({
  healthcheck: publicProcedure.query(healthcheck),
})

export const serverAppRouter = t.router({
  healthcheck: publicProcedure.query(healthcheck),
  pools: publicProcedure.query(getPools),
  pool: publicProcedure
    .input(z.object({shareAssetName: z.string()}))
    .query(({input}) => getPool(input.shareAssetName)),
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
