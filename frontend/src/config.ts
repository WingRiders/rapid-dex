import {supportedNetworks} from '@wingriders/rapid-dex-common'
import {env as runtimeEnv} from 'next-runtime-env'
import {z} from 'zod'

const envSchemas = {
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  NEXT_PUBLIC_NETWORK: z.enum(supportedNetworks),
  // internal network, used only on the server
  SERVER_URL: z.string(),
  // public network, used in the browser
  NEXT_PUBLIC_SERVER_URL: z.string(),
  NEXT_PUBLIC_SUBMIT_TX_METHOD: z
    .enum(['wallet', 'backend', 'both'])
    .default('wallet'),
  NEXT_PUBLIC_ENABLE_REACT_QUERY_DEVTOOLS: z
    .string()
    .default('false')
    .transform((v) => v === 'true'),
  NEXT_PUBLIC_ENABLE_DEBUG_LOGS: z
    .string()
    .default('false')
    .transform((v) => v === 'true'),
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
