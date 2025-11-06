import {Command} from 'commander'
import {buildAddLiquidityCommand} from './add-liquidity'
import {buildCreatePoolCommand} from './create-pool'
import {buildSwapCommand} from './swap'
import {buildWithdrawLiquidityCommand} from './withdraw-liquidity'

export const buildTransactionCommand = () => {
  const transactionCommand = new Command('transaction')
    .alias('tx')
    .description('Perform a transaction')

  transactionCommand.addCommand(buildCreatePoolCommand())
  transactionCommand.addCommand(buildSwapCommand())
  transactionCommand.addCommand(buildAddLiquidityCommand())
  transactionCommand.addCommand(buildWithdrawLiquidityCommand())

  return transactionCommand
}
