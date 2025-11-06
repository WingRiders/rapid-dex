import {MeshValue} from '@meshsdk/core'
import {createUnit, poolValidatorHash} from '@wingriders/rapid-dex-common'
import {Command} from 'commander'
import {computeReturnedTokens} from '../../../amm'
import {buildWithdrawLiquidityTx} from '../../../on-chain'
import {createTRPCClient} from '../../../trpc'
import {initConfig} from '../../config'
import {
  assertSufficientBalance,
  initWallet,
  parsePositiveBigNumberOption,
} from '../../helpers'

export const buildWithdrawLiquidityCommand = () => {
  const command = new Command('withdraw-liquidity')

  command
    .description(
      'Perform a withdraw liquidity transaction in the specified pool',
    )
    .requiredOption(
      '-s, --share-asset-name <string>',
      'The share asset name of the pool',
    )
    .requiredOption(
      '-q, --quantity <number>',
      'The quantity of shares to withdraw.',
      parsePositiveBigNumberOption,
    )
    .action(async (options) => {
      const config = await initConfig()

      const trpc = createTRPCClient({
        type: 'server',
        serverUrl: config.SERVER_URL,
      })

      const pool = await trpc.pool.query({
        shareAssetName: options.shareAssetName,
      })
      const poolUtxo = await trpc.poolUtxo.query({
        shareAssetName: options.shareAssetName,
      })

      const wallet = await initWallet(config)
      const balance = MeshValue.fromAssets(await wallet.getBalance())

      assertSufficientBalance(
        balance,
        createUnit(poolValidatorHash, pool.shareAssetName),
        options.quantity,
      )

      const {outA, outB} = computeReturnedTokens({
        lockShares: options.quantity,
        poolState: pool.poolState,
      })

      if (outA.lte(0) || outB.lte(0)) {
        throw new Error(
          'Would receive 0 output tokens, you need to provide more shares',
        )
      }

      const {builtTx, txFee} = await buildWithdrawLiquidityTx({
        wallet,
        pool: {
          ...pool,
          utxo: poolUtxo.utxo,
        },
        lockShares: options.quantity,
        outA,
        outB,
      })

      console.log('Transaction built', {txFee})

      const signedTx = await wallet.signTx(builtTx)
      console.log('Transaction signed')
      const txHash = await wallet.submitTx(signedTx)
      console.log('Transaction submitted', txHash)
    })

  return command
}
