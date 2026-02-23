import {MeshValue} from '@meshsdk/core'
import {
  createUnit,
  poolValidatorHash,
  type WithdrawType,
  withdrawTypes,
} from '@wingriders/rapid-dex-common'
import {Command, InvalidArgumentError} from 'commander'
import {computeWithdrawLiquidity} from '../../../amm'
import {buildWithdrawLiquidityTx} from '../../../on-chain'
import {createTRPCClient} from '../../../trpc'
import {initConfig} from '../../config'
import {
  assertSufficientBalance,
  initWallet,
  parsePositiveBigNumberOption,
} from '../../helpers'

const isWithdrawType = (value: string): value is WithdrawType =>
  withdrawTypes.includes(value as WithdrawType)

const parseWithdrawType = (value: string): WithdrawType => {
  if (!isWithdrawType(value)) {
    throw new InvalidArgumentError(
      `Invalid withdraw type: ${value}. Expected one of: ${withdrawTypes.join(', ')}`,
    )
  }

  return value
}

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
    .option(
      '-t, --withdraw-type <number>',
      `Withdraw type, one of: ${withdrawTypes.join(', ')}`,
      parseWithdrawType,
      'TO_BOTH',
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

      const {outA, outB, addToTreasuryA, addToTreasuryB} =
        computeWithdrawLiquidity({
          lockShares: options.quantity,
          poolState: pool.poolState,
          poolConfig: pool,
          withdrawType: options.withdrawType,
        })

      if (
        (options.withdrawType === 'TO_BOTH' && (outA.lte(0) || outB.lte(0))) ||
        (options.withdrawType === 'TO_A' && outA.lte(0)) ||
        (options.withdrawType === 'TO_B' && outB.lte(0))
      ) {
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
        withdrawType: options.withdrawType,
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
