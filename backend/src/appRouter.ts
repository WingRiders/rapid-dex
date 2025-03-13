import {healthcheck} from '@/endpoints/healthcheck'
import {getPool} from '@/endpoints/pool'
import {getPools} from '@/endpoints/pools'
import {initTRPC} from '@trpc/server'
import BigNumber from 'bignumber.js'
import superjson from 'superjson'
import {z} from 'zod'

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
})

// export type definition of API
export type ServerAppRouter = typeof serverAppRouter
