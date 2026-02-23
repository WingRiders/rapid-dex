import {MeshValue} from '@meshsdk/core'
import {Command, InvalidArgumentError} from 'commander'
import {computeAddLiquidity} from '../../../amm'
import {buildAddLiquidityTx} from '../../../on-chain'
import {createTRPCClient} from '../../../trpc'
import {initConfig} from '../../config'
import {
  assertSufficientBalance,
  initWallet,
  parseNonNegativeBigNumberOption,
} from '../../helpers'

export const buildAddLiquidityCommand = () => {
  const command = new Command('add-liquidity')

  command
    .description(
      'Perform an add liquidity transaction in the specified pool. For Zap-In one of the quantities should be zero.',
    )
    .requiredOption(
      '-s, --share-asset-name <string>',
      'The share asset name of the pool',
    )
    .requiredOption(
      '-a, --quantity-a <number>',
      'The quantity of the asset A to add.',
      parseNonNegativeBigNumberOption,
    )
    .requiredOption(
      '-b, --quantity-b <number>',
      'The quantity of the asset B to add.',
      parseNonNegativeBigNumberOption,
    )
    .action(async (options) => {
      if (options.quantityA.lte(0) && options.quantityB.lte(0)) {
        throw new InvalidArgumentError(
          `At least one of (--quantity-a, --quantity-b) should be > 0`,
        )
      }
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

      const {earnedShares, xSwap, addToTreasuryA, addToTreasuryB} =
        computeAddLiquidity({
          lockA: options.quantityA,
          lockB: options.quantityB,
          poolState: pool.poolState,
          poolConfig: pool,
        })

      if (earnedShares.lte(0)) {
        throw new InvalidArgumentError(
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
        xSwap,
        addToTreasuryA,
        addToTreasuryB,
      })

      console.log('Transaction built', {txFee})

      const signedTx = await wallet.signTx(builtTx)
      console.log('Transaction signed')
      const txHash = await wallet.submitTx(signedTx)
      console.log('Transaction submitted', txHash)
    })

  return command
}
