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
      '--swap-fee-a-to-b <number>',
      'Percentage fee for A to B swaps. Must be between 0 and 100.',
      parseIntegerOption({min: 0, max: 100}),
    )
    .requiredOption(
      '--swap-fee-b-to-a <number>',
      'Percentage fee for B to A swaps. Must be between 0 and 100.',
      parseIntegerOption({min: 0, max: 100}),
    )
    .requiredOption(
      '--treasury-fee-a-to-b <number>',
      'Percentage fee for A to B swaps. Must be between 0 and 100.',
      parseIntegerOption({min: 0, max: 100}),
    )
    .requiredOption(
      '--treasury-fee-b-to-a <number>',
      'Percentage fee for B to A swaps. Must be between 0 and 100.',
      parseIntegerOption({min: 0, max: 100}),
    )
    .requiredOption(
      '--treasury-authority-unit <string>',
      'Unit of treasury authority - its holder is allowed to withdraw treasury',
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

      const encodedSwapFeeAToB = encodeFee(
        new BigNumber(options.swapFeeAToB).div(100),
      )
      const encodedSwapFeeBToA = encodeFee(
        new BigNumber(options.swapFeeBToA).div(100),
      )
      const encodedTreasuryFeeAToB = encodeFee(
        new BigNumber(options.treasuryFeeAToB).div(100),
      )
      const encodedTreasuryFeeBToA = encodeFee(
        new BigNumber(options.treasuryFeeBToA).div(100),
      )

      const feeBasis = leastCommonMultiple(
        encodedSwapFeeAToB.feeBasis,
        encodedSwapFeeBToA.feeBasis,
        encodedTreasuryFeeAToB.feeBasis,
        encodedTreasuryFeeBToA.feeBasis,
      )

      const swapFeePointsAToB =
        (encodedSwapFeeAToB.feePoints * feeBasis) / encodedSwapFeeAToB.feeBasis
      const swapFeePointsBToA =
        (encodedSwapFeeBToA.feePoints * feeBasis) / encodedSwapFeeBToA.feeBasis
      const treasuryFeePointsAToB =
        (encodedTreasuryFeeAToB.feePoints * feeBasis) /
        encodedTreasuryFeeAToB.feeBasis
      const treasuryFeePointsBToA =
        (encodedTreasuryFeeBToA.feePoints * feeBasis) /
        encodedTreasuryFeeBToA.feeBasis

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
        treasuryFeePointsAToB,
        treasuryFeePointsBToA,
        treasuryAuthorityUnit: options.treasuryAuthorityUnit,
      })

      console.log('Transaction built', {txFee, sharesAssetName})

      const signedTx = await wallet.signTx(builtTx)
      console.log('Transaction signed')
      const txHash = await wallet.submitTx(signedTx)
      console.log('Transaction submitted', txHash)
    })

  return command
}
