import {MeshValue} from '@meshsdk/core'
import {Command, Option} from 'commander'
import {computeNewReserves} from '../../../amm'
import {buildSwapTx} from '../../../on-chain'
import {createTRPCClient} from '../../../trpc'
import {initConfig} from '../../config'
import {
  assertSufficientBalance,
  initWallet,
  parsePositiveBigNumberOption,
} from '../../helpers'

export const buildSwapCommand = () => {
  const command = new Command('swap')

  command
    .description('Perform a swap transaction in the specified pool')
    .requiredOption(
      '-s, --share-asset-name <string>',
      'The share asset name of the pool',
    )
    .requiredOption(
      '-q, --quantity <number>',
      'The quantity of the asset to swap',
      parsePositiveBigNumberOption,
    )
    .addOption(
      new Option('-d, --direction <string>', 'The direction of the swap')
        .choices(['aToB', 'bToA'])
        .default('aToB'),
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

      const [currentX, currentY, lockUnit, swapFeePoints, treasuryFeePoints] =
        options.direction === 'aToB'
          ? [
              pool.poolState.qtyA,
              pool.poolState.qtyB,
              pool.unitA,
              pool.swapFeePointsAToB,
              pool.treasuryFeePointsAToB,
            ]
          : [
              pool.poolState.qtyB,
              pool.poolState.qtyA,
              pool.unitB,
              pool.swapFeePointsBToA,
              pool.treasuryFeePointsBToA,
            ]

      const wallet = await initWallet(config)
      const balance = MeshValue.fromAssets(await wallet.getBalance())

      assertSufficientBalance(balance, lockUnit, options.quantity)

      const {lockX, outY} = computeNewReserves({
        currentX,
        currentY,
        swapFeePoints,
        treasuryFeePoints,
        feeBasis: pool.feeBasis,
        lockX: options.quantity,
        aToB: options.direction === 'aToB',
        feeFrom: pool.feeFrom,
      })

      if (outY.lte(0)) {
        throw new Error(
          'Would receive 0 output tokens, you need to provide more input tokens',
        )
      }

      const {builtTx, txFee} = await buildSwapTx({
        wallet,
        pool: {
          ...pool,
          utxo: poolUtxo.utxo,
        },
        aToB: options.direction === 'aToB',
        lockX,
        outY,
      })

      console.log('Transaction built', {txFee})

      const signedTx = await wallet.signTx(builtTx)
      console.log('Transaction signed')
      const txHash = await wallet.submitTx(signedTx)
      console.log('Transaction submitted', txHash)
    })

  return command
}
