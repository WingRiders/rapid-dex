import {homedir} from 'node:os'
import {join} from 'node:path'
import type {NetworkId} from '@wingriders/rapid-dex-common'
import {type BunFile, secrets} from 'bun'
import {z} from 'zod'

const SECRETS_SERVICE = 'rapid-dex'
const CONFIG_DIR_PATH = join(homedir(), '.config', 'rapid-dex')
const CONFIG_FILE_PATH = join(CONFIG_DIR_PATH, 'config.json')

export const CONFIG_SCHEMAS = {
  NETWORK_ID: z.coerce
    .number()
    .int()
    .min(0)
    .max(1)
    .transform((val) => val as NetworkId),
  SERVER_URL: z.string(),
  WALLET_MNEMONIC: z.string(),
  BLOCKFROST_PROJECT_ID: z.string(),
}

export type ConfigKey = keyof typeof CONFIG_SCHEMAS
export const CONFIG_KEYS = Object.keys(CONFIG_SCHEMAS) as ConfigKey[]

export type ConfigObject = {
  [key in ConfigKey]: z.infer<(typeof CONFIG_SCHEMAS)[key]>
}

// these keys are stored as secrets, other keys are stored as a plain text in the config file
const SECRET_KEYS: ConfigKey[] = ['WALLET_MNEMONIC', 'BLOCKFROST_PROJECT_ID']

const getConfigFileContent = async (file: BunFile) =>
  (await file.exists()) ? await file.json() : {}

export const initConfig = async (): Promise<ConfigObject> => {
  const config: Record<string, any> = {}

  const configBunFile = Bun.file(CONFIG_FILE_PATH)
  const configFile = await getConfigFileContent(configBunFile)

  let hasErrors = false
  for (const configKey of CONFIG_KEYS) {
    const configSchema = CONFIG_SCHEMAS[configKey]
    let value: unknown
    if (SECRET_KEYS.includes(configKey)) {
      value = await secrets.get({
        service: SECRETS_SERVICE,
        name: configKey,
      })
    } else {
      value = configFile[configKey]
    }
    const parsedValue = configSchema.safeParse(value)

    if (parsedValue.success) config[configKey] = parsedValue.data
    else {
      console.error(
        parsedValue.error?.format(),
        `Error while parsing config ${configKey}: ${value}`,
      )
      hasErrors = true
    }
  }

  if (hasErrors) {
    throw new Error('Errors while parsing config')
  }

  return config as ConfigObject
}

export const clearConfig = async () => {
  const configBunFile = Bun.file(CONFIG_FILE_PATH)
  if (await configBunFile.exists()) {
    await configBunFile.delete()
  }

  for (const key of SECRET_KEYS) {
    await secrets.delete({
      service: SECRETS_SERVICE,
      name: key,
    })
  }
}

export const setConfigKey = async <TKey extends ConfigKey>(
  key: TKey,
  value: ConfigObject[TKey],
) => {
  if (SECRET_KEYS.includes(key)) {
    if (value == null) {
      await secrets.delete({
        service: SECRETS_SERVICE,
        name: key,
      })
    } else {
      await secrets.set({
        service: SECRETS_SERVICE,
        name: key,
        value: value.toString(),
      })
    }
  } else {
    const configBunFile = Bun.file(CONFIG_FILE_PATH)
    const configFile = await getConfigFileContent(configBunFile)
    if (value == null) {
      delete configFile[key]
    } else {
      configFile[key] = value
    }
    await configBunFile.write(JSON.stringify(configFile, null, 2))
  }
}
