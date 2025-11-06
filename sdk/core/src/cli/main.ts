import {Command} from 'commander'

import {buildConfigCommand} from './commands/config'
import {buildTransactionCommand} from './commands/transaction/transaction'

const main = async () => {
  const program = new Command()

  program
    .name('rapid-dex')
    .description('A CLI tool for working with WingRiders Rapid DEX')
    .version('1.0.0')

  program.addCommand(buildConfigCommand())
  program.addCommand(buildTransactionCommand())

  program.parse(process.argv)
}

main()
