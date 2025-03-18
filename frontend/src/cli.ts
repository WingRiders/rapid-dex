import {addLiquidity} from '@/cli/add-liquidity'
import {createPool} from '@/cli/create-pool'
import {swap} from '@/cli/swap'
import {withdrawLiquidity} from '@/cli/withdraw-liquidity'
import {NetworkId} from '@wingriders/rapid-dex-common'
import {Command} from 'commander'

const program = new Command()

const withCommonOptions = (cmd: Command) =>
  cmd
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

const withCommonOptionsSpendingPoolUtxo = (cmd: Command) =>
  withCommonOptions(cmd).requiredOption(
    '--shareAssetName <string>',
    'Asset name of the shares (LP tokens)',
  )

program
  .name('rapid-dex CLI')
  .description('A CLI tool for working with rapid-dex')

withCommonOptions(
  program
    .command('create-pool')
    .description('Create and submit transaction to create pool.')
    .requiredOption('--unitA <string>', 'First asset policy ID and name')
    .requiredOption('--quantityA <number>', 'Quantity of first asset', Number)
    .requiredOption('--unitB <string>', 'Second asset policy ID and name')
    .requiredOption('--quantityB <number>', 'Quantity of second asset', Number)
    .requiredOption('--swapFeePoints <number>', 'Fee param', Number)
    .requiredOption('--feeBasis <number>', 'Fee param', Number)
    .action(createPool),
)

withCommonOptionsSpendingPoolUtxo(
  program
    .command('swap')
    .description('Create and submit transaction to swap.')
    .requiredOption('--quantityX <number>', 'Quantity of token to swap', Number)
    .option(
      '--direction <string>',
      'Swap direction: aToB (default) or bToA',
      (value) => {
        if (!['aToB', 'bToA'].includes(value))
          throw new Error('Invalid direction. Must be aToB or bToA.')
        return value as 'aToB' | 'bToA'
      },
      'aToB',
    )
    .action(swap),
)

withCommonOptionsSpendingPoolUtxo(
  program
    .command('add-liquidity')
    .description('Create and submit transaction to add liquidity.')
    .requiredOption('--quantityA <number>', 'Quantity of tokenA to add', Number)
    .requiredOption('--quantityB <number>', 'Quantity of tokenB to add', Number)
    .action(addLiquidity),
)

withCommonOptionsSpendingPoolUtxo(
  program
    .command('withdraw-liquidity')
    .description('Create and submit transaction to withdraw liquidity.')
    .requiredOption(
      '--quantityShares <number>',
      'Quantity of shares to withdraw',
      Number,
    )
    .action(withdrawLiquidity),
)

if (process.argv.length <= 2) {
  program.outputHelp()
  process.exit(0)
}

program.parse(process.argv)
