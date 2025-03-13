import {createReferenceScriptUtxo} from '@/cli/createReferenceScriptUtxo'
import {NetworkId} from '@/helpers/wallet'
import {Command} from 'commander'

const program = new Command()

program
  .name('rapid-dex CLI')
  .description('A CLI tool for working with rapid-dex')

program
  .command('create-reference-script-utxo')
  .description(
    'Create and submit transaction with reference script UTxO for pool script.',
  )
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
  .option('--stakeKeyHash <string>', 'Staking part for pool address')
  .action(createReferenceScriptUtxo)

if (process.argv.length <= 2) {
  program.outputHelp()
  process.exit(0)
}

program.parse(process.argv)
