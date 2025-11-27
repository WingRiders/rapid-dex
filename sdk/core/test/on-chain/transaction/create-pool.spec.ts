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
  treasuryAuthorityUnit,
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
  treasuryAuthorityUnit,
  treasuryFeePointsAToB: 5,
  treasuryFeePointsBToA: 5,
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
      '84aa00d9010281825820cafecafecafecafecafecafecafecafecafecafecafecafecafecafecafecafe010182a300581d70e1bab9966010c5c952e143697e00e3627b5981b111362a437a0150ee01821a001e8480a3581cbeefbeefbeefbeefbeefbeefbeefbeefbeefbeefbeefbeefbeefbeefa140192710581cdeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeada140192710581ce1bab9966010c5c952e143697e00e3627b5981b111362a437a0150eea24150015820ddabe0e48f841cb5285d343b233154dabb9d7994e922baf9cc4efee28b0b00081b7fffffffffffd8ef028201d818588fd8799f581cbeefbeefbeefbeefbeefbeefbeefbeefbeefbeefbeefbeefbeefbeef40581cdeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddead400000d87980581cdeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddead4005050a0a1927105820ddabe0e48f841cb5285d343b233154dabb9d7994e922baf9cc4efee28b0b0008ff825839009493315cd92eb5d8c4304e67b7e16ae36d61d34502694657811a2c8e337b62cfff6403a06a3acbc34f8c46003c69fe79a3628cefa9c47251821a005583eaa1581ce1bab9966010c5c952e143697e00e3627b5981b111362a437a0150eea15820ddabe0e48f841cb5285d343b233154dabb9d7994e922baf9cc4efee28b0b0008192328021a00060996031a051229b1075820bdaa99eb158414dea0a91d6c727e2268574b23efe6e08ab3b841abe8059a030c09a1581ce1bab9966010c5c952e143697e00e3627b5981b111362a437a0150eea24150015820ddabe0e48f841cb5285d343b233154dabb9d7994e922baf9cc4efee28b0b00081b7ffffffffffffc170b5820d104460e280df9691108a1a3cc28ac45b06a518c3512e324149ccbb7930a8acd0dd9010281825820cafecafecafecafecafecafecafecafecafecafecafecafecafecafecafecafe000ed9010281581c9493315cd92eb5d8c4304e67b7e16ae36d61d34502694657811a2c8e12d90102818258202c4c554ab6639565fefe958e39718bcb0f0bae74212fc43b89365a3cf4e14ee200a105a182010082d8799fd8799f5820cafecafecafecafecafecafecafecafecafecafecafecafecafecafecafecafe01ffff821a0008adb81a0a6e5402f5d90103a0',
    )
    expect(result.txFee).toEqual(new BigNumber(395670))
  })
})
