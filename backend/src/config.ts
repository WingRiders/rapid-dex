import {z} from 'zod'

const envSchema = z.object({
  MODE: z.enum(['aggregator', 'server', 'both']).default('both'),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  SERVER_PORT: z.coerce.number().positive(),
  NETWORK: z.enum(['preprod']).default('preprod'), // TODO: add mainnet once bootstrap is done
  DATABASE_URL: z.string(),
  REDIS_URL: z.string().optional(),
  OGMIOS_HOST: z.string(),
  OGMIOS_PORT: z.coerce.number().positive(),
  CORS_ENABLED_FOR: z.string().optional(),
})

const parsedEnv = envSchema
  .superRefine((data, ctx) => {
    if (data.MODE !== 'both' && !data.REDIS_URL) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'REDIS_URL is required when MODE is not "both"',
        path: ['REDIS_URL'],
      })
    }
  })
  .safeParse(process.env)

if (!parsedEnv.success) {
  // Using console because pino logger depends on the config
  console.error(
    'Environment variables validation failed',
    parsedEnv.error.format(),
  )
  process.exit(1)
}

export const config = parsedEnv.data

export const isProd = config.NODE_ENV === 'production'

export const isAggregatorMode = ['aggregator', 'both'].includes(config.MODE)
export const isOnlyAggregatorMode = config.MODE === 'aggregator'
export const isServerMode = ['server', 'both'].includes(config.MODE)
export const isOnlyServerMode = config.MODE === 'server'
