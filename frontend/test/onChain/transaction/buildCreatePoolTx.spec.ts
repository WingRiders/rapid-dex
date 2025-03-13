import {describe, expect, it} from 'bun:test'
import {buildCreatePoolTx} from '@/onChain/transaction/buildCreatePoolTx'
import {BigNumber} from 'bignumber.js'
import {
  assetA,
  assetB,
  collateralUtxo,
  mockWallet,
  mockWalletUtxos,
  seedUtxo,
} from './fixtures'

const createPoolTxArgs = {
  network: 'preprod' as const,
  wallet: mockWallet,
  assetA: assetA,
  assetB: assetB,
  seed: {
    txHash: seedUtxo.input.txHash,
    txIndex: seedUtxo.input.outputIndex,
  },
  feeBasis: 10000,
  swapFeePoints: 10,
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

  it('throws readable error when assetA and assetB are the same', () => {
    mockWalletUtxos([collateralUtxo, seedUtxo])
    expect(() =>
      buildCreatePoolTx({...createPoolTxArgs, assetB: assetA}),
    ).toThrow(
      /^Tx evaluation failed: .*bytearray.compare\(pool_output_datum.a_asset_name, pool_output_datum.b_asset_name\) == Less \? False.* \n For txHex: [0-9a-fA-F]+$/,
    )
  })

  it('returns built transaction and fee', async () => {
    mockWalletUtxos([collateralUtxo, seedUtxo])

    // Fixed date for deterministic TTL in the built transaction
    const now = new Date(1740757801042)
    const result = await buildCreatePoolTx({...createPoolTxArgs, now})

    expect(result.builtTx).toEqual(
      '84aa00d9010281825820cafecafecafecafecafecafecafecafecafecafecafecafecafecafecafecafe010182a300583910ab2299306876268c3af74d47b702f4b6697ba31413fa718a422e707dbef7f14cde5eabb16a698e8b8f15e346b260a17b6ff26e572c06a5b701821a001e8480a3581cab2299306876268c3af74d47b702f4b6697ba31413fa718a422e707da24150015820ddabe0e48f841cb5285d343b233154dabb9d7994e922baf9cc4efee28b0b00081b7fffffffffffd8ef581cbeefbeefbeefbeefbeefbeefbeefbeefbeefbeefbeefbeefbeefbeefa140192710581cdeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeada140192710028201d8185868d8799f581cbeefbeefbeefbeefbeefbeefbeefbeefbeefbeefbeefbeefbeefbeef40581cdeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddead400a1927105820ddabe0e48f841cb5285d343b233154dabb9d7994e922baf9cc4efee28b0b0008ff825839009493315cd92eb5d8c4304e67b7e16ae36d61d34502694657811a2c8e337b62cfff6403a06a3acbc34f8c46003c69fe79a3628cefa9c47251821a00563e99a1581cab2299306876268c3af74d47b702f4b6697ba31413fa718a422e707da15820ddabe0e48f841cb5285d343b233154dabb9d7994e922baf9cc4efee28b0b0008192328021a00054ee7031a051229b1075820bdaa99eb158414dea0a91d6c727e2268574b23efe6e08ab3b841abe8059a030c09a1581cab2299306876268c3af74d47b702f4b6697ba31413fa718a422e707da24150015820ddabe0e48f841cb5285d343b233154dabb9d7994e922baf9cc4efee28b0b00081b7ffffffffffffc170b582076da4871c1bd02ab87757ee62690dea3b3ec63174b40f85523bc0f4cd3c99d670dd9010281825820cafecafecafecafecafecafecafecafecafecafecafecafecafecafecafecafe000ed9010281581c9493315cd92eb5d8c4304e67b7e16ae36d61d34502694657811a2c8e12d9010281825820f74ec90931a407cc641191d2aee2bea64f8168860f99ab6ce6a507636c64160f00a105a18201008280821a000776261a08ad9ed5f5d90103a0',
    )
    expect(result.txFee).toEqual(new BigNumber(347879))
  })
})
