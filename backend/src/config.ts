import {z} from 'zod'

const envSchema = z.object({
  MODE: z.enum(['aggregator', 'server', 'both']).default('both'),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  SERVER_PORT: z.coerce.number().positive(),
  NETWORK: z.enum(['preprod']).default('preprod'), // TODO: add mainnet once bootstrap is done
  DATABASE_URL: z.string(),
  OGMIOS_HOST: z.string(),
  OGMIOS_PORT: z.coerce.number().positive(),
})

const parsedEnv = envSchema.safeParse(process.env)

if (!parsedEnv.success) {
  // Using console because pino logger depends on the config
  console.error(
    'Environment variables validation failed',
    parsedEnv.error.format(),
  )
  process.exit(1)
}

export const config = parsedEnv.data
