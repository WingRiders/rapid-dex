import {createPool} from '@/cli/create-pool'
import {NetworkId} from '@wingriders/rapid-dex-common'
import {Command} from 'commander'

const program = new Command()

program
  .name('rapid-dex CLI')
  .description('A CLI tool for working with rapid-dex')

program
  .command('create-pool')
  .description('Create and submit transaction to create pool.')
  .requiredOption('--blockfrostProjectId <string>', 'Blockfrost project ID')
  .option(
    '--networkId <number>',
    'Network ID (0 for Preprod, 1 for Mainnet)',
    (value) => {
      const num = Number(value)
      if (!Object.values(NetworkId).includes(num))
        throw new Error(
          'Invalid networkId. Must be 0 (Preprod) or 1 (Mainnet).',
        )
      return num as NetworkId
    },
    NetworkId.TESTNET,
  )
  .requiredOption('--mnemonic <string>', 'Wallet mnemonic phrase')
  .requiredOption(
    '--unitA <string>',
    'Policy ID concatenated with asset name of the first asset of the asset pair',
  )
  .requiredOption(
    '--quantityA <number>',
    'Quantity of the first asset of the asset pair',
    Number,
  )
  .requiredOption(
    '--unitB <string>',
    'Policy ID concatenated with asset name of the second asset of the asset pair',
  )
  .requiredOption(
    '--quantityB <number>',
    'Quantity of the second asset of the asset pair',
    Number,
  )
  .requiredOption('--swapFeePoints <number>', 'Fee param', Number)
  .requiredOption('--feeBasis <number>', 'Fee param', Number)
  .action(createPool)

if (process.argv.length <= 2) {
  program.outputHelp()
  process.exit(0)
}

program.parse(process.argv)
