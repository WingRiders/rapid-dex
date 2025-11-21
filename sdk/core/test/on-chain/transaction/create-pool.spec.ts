import {describe, expect, it} from 'bun:test'
import {FeeFrom} from '@wingriders/rapid-dex-common'
import {BigNumber} from 'bignumber.js'
import {
  type BuildCreatePoolTxArgs,
  buildCreatePoolTx,
} from '../../../src/on-chain/transaction/create-pool'
import {
  assetA,
  assetB,
  collateralUtxo,
  mockWallet,
  mockWalletUtxos,
  seedUtxo,
} from './fixtures'

const createPoolTxArgs: BuildCreatePoolTxArgs = {
  wallet: mockWallet,
  assetX: assetA,
  assetY: assetB,
  outShares: new BigNumber(9_000),
  seed: {
    txHash: seedUtxo.input.txHash,
    txIndex: seedUtxo.input.outputIndex,
  },
  feeBasis: 10000,
  feeFrom: FeeFrom.InputToken,
  swapFeePointsAToB: 10,
  swapFeePointsBToA: 10,
}

describe('buildCreatePoolTx', () => {
  it('throws readable error when no collateral UTxO is found', () => {
    mockWalletUtxos([])
    expect(buildCreatePoolTx(createPoolTxArgs)).rejects.toThrow(
      'No collateral UTxO found',
    )
  })

  it('throws readable error when seed UTxO is missing in the wallet', () => {
    mockWalletUtxos([collateralUtxo])
    expect(buildCreatePoolTx(createPoolTxArgs)).rejects.toThrow(
      "Couldn't find value information for cafecafecafecafecafecafecafecafecafecafecafecafecafecafecafecafe#1",
    )
  })

  it('throws readable error when assetX and assetY are the same', () => {
    mockWalletUtxos([collateralUtxo, seedUtxo])
    // MeshSDK changed it's validation order - now it checks balance first,
    // so to get to script validation we need to ensure we have enough funds.
    const sameAssetQuantity = String(Number(assetA.quantity) / 2)
    expect(() =>
      buildCreatePoolTx({
        ...createPoolTxArgs,
        assetX: {...assetA, quantity: sameAssetQuantity},
        assetY: {...assetA, quantity: sameAssetQuantity},
      }),
    ).toThrow(
      /^.*Tx evaluation failed: .*bytearray.compare\(pool_output_datum.a_asset_name, pool_output_datum.b_asset_name\) == Less \? False.* \n For txHex: [0-9a-fA-F]+$/,
    )
  })

  it('returns built transaction and fee', async () => {
    mockWalletUtxos([collateralUtxo, seedUtxo])

    // Fixed date for deterministic TTL in the built transaction
    const now = new Date(1740757801042)
    const result = await buildCreatePoolTx({...createPoolTxArgs, now})

    expect(result.builtTx).toEqual(
      '84aa00d9010281825820cafecafecafecafecafecafecafecafecafecafecafecafecafecafecafecafe010182a300581d706801a56ce0ace009720da26f8e4a1fdf27a0ef1108736172d5e72e0701821a001e8480a3581c6801a56ce0ace009720da26f8e4a1fdf27a0ef1108736172d5e72e07a24150015820ddabe0e48f841cb5285d343b233154dabb9d7994e922baf9cc4efee28b0b00081b7fffffffffffd8ef581cbeefbeefbeefbeefbeefbeefbeefbeefbeefbeefbeefbeefbeefbeefa140192710581cdeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeada140192710028201d818586cd8799f581cbeefbeefbeefbeefbeefbeefbeefbeefbeefbeefbeefbeefbeefbeef40581cdeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddead40d879800a0a1927105820ddabe0e48f841cb5285d343b233154dabb9d7994e922baf9cc4efee28b0b0008ff825839009493315cd92eb5d8c4304e67b7e16ae36d61d34502694657811a2c8e337b62cfff6403a06a3acbc34f8c46003c69fe79a3628cefa9c47251821a00560e56a1581c6801a56ce0ace009720da26f8e4a1fdf27a0ef1108736172d5e72e07a15820ddabe0e48f841cb5285d343b233154dabb9d7994e922baf9cc4efee28b0b0008192328021a00057f2a031a051229b1075820bdaa99eb158414dea0a91d6c727e2268574b23efe6e08ab3b841abe8059a030c09a1581c6801a56ce0ace009720da26f8e4a1fdf27a0ef1108736172d5e72e07a24150015820ddabe0e48f841cb5285d343b233154dabb9d7994e922baf9cc4efee28b0b00081b7ffffffffffffc170b5820ea28c73ffe54842d02cd6c1b719203a0c58e6bceea6228bdaa32a96095350fe90dd9010281825820cafecafecafecafecafecafecafecafecafecafecafecafecafecafecafecafe000ed9010281581c9493315cd92eb5d8c4304e67b7e16ae36d61d34502694657811a2c8e12d9010281825820a2dcb7ed71cc92ec3bf820a14d6d9d7c7aebec3a520bbef7c9e9bf627bdec6e500a105a182010082d8799fd8799f5820cafecafecafecafecafecafecafecafecafecafecafecafecafecafecafecafe01ffff821a00079b571a08ff8a50f5d90103a0',
    )
    expect(result.txFee).toEqual(new BigNumber(360234))
  })
})
