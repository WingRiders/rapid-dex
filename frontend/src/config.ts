import {z} from 'zod'

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  // internal network, used only on the server
  SERVER_URL: z.string().default('http://localhost:3300'),
  // public network, used in the browser
  NEXT_PUBLIC_SERVER_URL: z.string().default('http://localhost:3300'),
})

const parsedEnv = envSchema.safeParse(process.env)

if (!parsedEnv.success) {
  console.error(
    'Environment variables validation failed',
    parsedEnv.error.format(),
  )
  process.exit(1)
}

export const config = parsedEnv.data
