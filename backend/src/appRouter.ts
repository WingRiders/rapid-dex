import {healthcheck} from '@/endpoints/healthcheck'
import {initTRPC} from '@trpc/server'

export const t = initTRPC.create()
export const publicProcedure = t.procedure
export const appRouter = t.router({
  healthcheck: publicProcedure.query(healthcheck),
})
// export type definition of API
export type AppRouter = typeof appRouter
