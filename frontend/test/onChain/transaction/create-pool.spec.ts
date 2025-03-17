import {describe, expect, it} from 'bun:test'
import {buildCreatePoolTx} from '@/onChain/transaction/create-pool'
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
  outShares: new BigNumber(9_000),
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
      '84aa00d9010281825820cafecafecafecafecafecafecafecafecafecafecafecafecafecafecafecafe010182a300583910fd8e13e9dfd770d01eb69c18aa04468e9c7c7ad905672191c5cb48f2b301ca25899116edef9065b0ecbab42deba3e351916f534df20173c601821a001e8480a3581cbeefbeefbeefbeefbeefbeefbeefbeefbeefbeefbeefbeefbeefbeefa140192710581cdeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeada140192710581cfd8e13e9dfd770d01eb69c18aa04468e9c7c7ad905672191c5cb48f2a24150015820ddabe0e48f841cb5285d343b233154dabb9d7994e922baf9cc4efee28b0b00081b7fffffffffffd8ef028201d8185868d8799f581cbeefbeefbeefbeefbeefbeefbeefbeefbeefbeefbeefbeefbeefbeef40581cdeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddead400a1927105820ddabe0e48f841cb5285d343b233154dabb9d7994e922baf9cc4efee28b0b0008ff825839009493315cd92eb5d8c4304e67b7e16ae36d61d34502694657811a2c8e337b62cfff6403a06a3acbc34f8c46003c69fe79a3628cefa9c47251821a00561d83a1581cfd8e13e9dfd770d01eb69c18aa04468e9c7c7ad905672191c5cb48f2a15820ddabe0e48f841cb5285d343b233154dabb9d7994e922baf9cc4efee28b0b0008192328021a00056ffd031a051229b1075820bdaa99eb158414dea0a91d6c727e2268574b23efe6e08ab3b841abe8059a030c09a1581cfd8e13e9dfd770d01eb69c18aa04468e9c7c7ad905672191c5cb48f2a24150015820ddabe0e48f841cb5285d343b233154dabb9d7994e922baf9cc4efee28b0b00081b7ffffffffffffc170b58200bd35935ea3f851bf96e98f0ea4bb4007691645c61d9be3686943d7140cf6f250dd9010281825820cafecafecafecafecafecafecafecafecafecafecafecafecafecafecafecafe000ed9010281581c9493315cd92eb5d8c4304e67b7e16ae36d61d34502694657811a2c8e12d9010281825820b1ec99f79391fc8f431ef323dfa3cae217fee7ecd8f53d13b9f342bfc8b72f6100a105a182010082d8799fd8799f5820cafecafecafecafecafecafecafecafecafecafecafecafecafecafecafecafe01ffff821a0008181d1a096f47d3f5d90103a0',
    )
    expect(result.txFee).toEqual(new BigNumber(356349))
  })
})
