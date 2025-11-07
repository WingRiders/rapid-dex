import {MeshValue} from '@meshsdk/core'
import {FeeFrom} from '@wingriders/rapid-dex-common'
import BigNumber from 'bignumber.js'
import {Command, Option} from 'commander'
import {computeSharesCreatePool} from '../../../amm'
import {encodeFee} from '../../../helpers'
import {leastCommonMultiple} from '../../../helpers/number'
import {buildCreatePoolTx} from '../../../on-chain'
import {initConfig} from '../../config'
import {
  assertSufficientBalance,
  initWallet,
  parseIntegerOption,
  parsePositiveBigNumberOption,
} from '../../helpers'

export const buildCreatePoolCommand = () => {
  const command = new Command('create-pool')

  command
    .description('Perform a create pool transaction')
    .requiredOption('--unit-x <string>', 'Unit of asset X')
    .requiredOption('--unit-y <string>', 'Unit of asset Y')
    .requiredOption(
      '--quantity-x <number>',
      'Quantity of asset X',
      parsePositiveBigNumberOption,
    )
    .requiredOption(
      '--quantity-y <number>',
      'Quantity of asset Y',
      parsePositiveBigNumberOption,
    )
    .requiredOption(
      '--fee-a-to-b <number>',
      'Percentage fee for A to B swaps. Must be between 0 and 100.',
      parseIntegerOption({min: 0, max: 100}),
    )
    .requiredOption(
      '--fee-b-to-a <number>',
      'Percentage fee for B to A swaps. Must be between 0 and 100.',
      parseIntegerOption({min: 0, max: 100}),
    )
    .addOption(
      new Option('--fee-from <string>', 'Fee from')
        .choices(Object.values(FeeFrom))
        .makeOptionMandatory(),
    )
    .action(async (options) => {
      const config = await initConfig()

      const wallet = await initWallet(config)
      const balance = MeshValue.fromAssets(await wallet.getBalance())

      assertSufficientBalance(balance, options.unitX, options.quantityX)
      assertSufficientBalance(balance, options.unitY, options.quantityY)

      const outShares = computeSharesCreatePool({
        lockX: options.quantityX,
        lockY: options.quantityY,
      })

      if (outShares.lte(0)) {
        throw new Error(
          'Would receive 0 shares, you need to provide more input tokens',
        )
      }

      const utxos = await wallet.getUtxos()
      if (utxos.length === 0) {
        throw new Error('No UTxOs found')
      }
      const seed = utxos[0]!

      const encodedFeeAToB = encodeFee(new BigNumber(options.feeAToB).div(100))
      const encodedFeeBToA = encodeFee(new BigNumber(options.feeBToA).div(100))

      const feeBasis = leastCommonMultiple(
        encodedFeeAToB.feeBasis,
        encodedFeeBToA.feeBasis,
      )

      const swapFeePointsAToB =
        (encodedFeeAToB.feePoints * feeBasis) / encodedFeeAToB.feeBasis
      const swapFeePointsBToA =
        (encodedFeeBToA.feePoints * feeBasis) / encodedFeeBToA.feeBasis

      const {builtTx, txFee, sharesAssetName} = await buildCreatePoolTx({
        wallet,
        assetX: {
          unit: options.unitX,
          quantity: options.quantityX.toString(),
        },
        assetY: {
          unit: options.unitY,
          quantity: options.quantityY.toString(),
        },
        outShares,
        seed: {
          txHash: seed.input.txHash,
          txIndex: seed.input.outputIndex,
        },
        feeBasis,
        feeFrom: options.feeFrom,
        swapFeePointsAToB,
        swapFeePointsBToA,
      })

      console.log('Transaction built', {txFee, sharesAssetName})

      const signedTx = await wallet.signTx(builtTx)
      console.log('Transaction signed')
      const txHash = await wallet.submitTx(signedTx)
      console.log('Transaction submitted', txHash)
    })

  return command
}
