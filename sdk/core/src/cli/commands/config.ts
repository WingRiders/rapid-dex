import {Command, Option} from 'commander'
import {
  CONFIG_KEYS,
  CONFIG_SCHEMAS,
  clearConfig,
  initConfig,
  setConfigKey,
} from '../config'

export const buildConfigCommand = () => {
  const configCommand = new Command('config').description(
    'Manage the configuration',
  )

  configCommand
    .command('print')
    .description('Print the current configuration')
    .action(async () => {
      const config = await initConfig()
      console.log(config)
    })

  configCommand
    .command('clear')
    .description('Clear the current configuration')
    .action(async () => {
      await clearConfig()
      console.log('Config cleared')
    })

  configCommand
    .command('set-key')
    .description('Set a key in the current configuration')
    .addOption(
      new Option('-k, --key <key>', 'The key to set')
        .choices(CONFIG_KEYS)
        .makeOptionMandatory(),
    )
    .requiredOption('-v, --value <value>', 'The value to set')
    .action(async (options) => {
      const parsedValue = CONFIG_SCHEMAS[options.key].safeParse(options.value)
      if (!parsedValue.success) {
        console.error(parsedValue.error.format())
        throw new Error('Invalid value')
      }
      await setConfigKey(options.key, parsedValue.data)
    })

  // TODO: add option to set config from file

  return configCommand
}
