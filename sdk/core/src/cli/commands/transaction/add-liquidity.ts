import {MeshValue} from '@meshsdk/core'
import {Command} from 'commander'
import {computeEarnedShares} from '../../../amm'
import {buildAddLiquidityTx} from '../../../on-chain'
import {createTRPCClient} from '../../../trpc'
import {initConfig} from '../../config'
import {
  assertSufficientBalance,
  initWallet,
  parsePositiveBigNumberOption,
} from '../../helpers'

export const buildAddLiquidityCommand = () => {
  const command = new Command('add-liquidity')

  command
    .description('Perform an add liquidity transaction in the specified pool')
    .requiredOption(
      '-s, --share-asset-name <string>',
      'The share asset name of the pool',
    )
    .requiredOption(
      '-a, --quantity-a <number>',
      'The quantity of the asset A to add.',
      parsePositiveBigNumberOption,
    )
    .requiredOption(
      '-b, --quantity-b <number>',
      'The quantity of the asset B to add.',
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

      assertSufficientBalance(balance, pool.unitA, options.quantityA)
      assertSufficientBalance(balance, pool.unitB, options.quantityB)

      const earnedShares = computeEarnedShares({
        lockA: options.quantityA,
        lockB: options.quantityB,
        poolState: pool.poolState,
      })

      if (earnedShares.lte(0)) {
        throw new Error(
          'Would receive 0 shares, you need to provide more input tokens',
        )
      }

      const {builtTx, txFee} = await buildAddLiquidityTx({
        wallet,
        pool: {
          ...pool,
          utxo: poolUtxo.utxo,
        },
        lockA: options.quantityA,
        lockB: options.quantityB,
        earnedShares,
      })

      console.log('Transaction built', {txFee})

      const signedTx = await wallet.signTx(builtTx)
      console.log('Transaction signed')
      const txHash = await wallet.submitTx(signedTx)
      console.log('Transaction submitted', txHash)
    })

  return command
}
