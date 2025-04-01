import {env as runtimeEnv} from 'next-runtime-env'
import {z} from 'zod'

const envSchemas = {
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  // internal network, used only on the server
  SERVER_URL: z.string(),
  // public network, used in the browser
  NEXT_PUBLIC_SERVER_URL: z.string(),
}

type Env = {
  [key in keyof typeof envSchemas]: z.infer<(typeof envSchemas)[key]>
}

export const env = <TKey extends keyof Env>(key: TKey): Env[TKey] => {
  const rawValue = runtimeEnv(key)
  try {
    return envSchemas[key].parse(rawValue) as Env[TKey]
  } catch (error) {
    throw new Error(
      `Error while parsing environment variable ${key}: ${rawValue}`,
      {cause: error},
    )
  }
}
