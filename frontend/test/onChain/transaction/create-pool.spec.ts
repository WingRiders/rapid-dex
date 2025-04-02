import {describe, expect, it} from 'bun:test'
import {
  type BuildCreatePoolTxArgs,
  buildCreatePoolTx,
} from '@/on-chain/transaction/create-pool'
import {BigNumber} from 'bignumber.js'
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

  it('throws readable error when assetX and assetY are the same', () => {
    mockWalletUtxos([collateralUtxo, seedUtxo])
    expect(() =>
      buildCreatePoolTx({...createPoolTxArgs, assetY: assetA}),
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
      '84aa00d9010281825820cafecafecafecafecafecafecafecafecafecafecafecafecafecafecafecafe010182a300581d70fd8e13e9dfd770d01eb69c18aa04468e9c7c7ad905672191c5cb48f201821a001e8480a3581cbeefbeefbeefbeefbeefbeefbeefbeefbeefbeefbeefbeefbeefbeefa140192710581cdeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeada140192710581cfd8e13e9dfd770d01eb69c18aa04468e9c7c7ad905672191c5cb48f2a24150015820ddabe0e48f841cb5285d343b233154dabb9d7994e922baf9cc4efee28b0b00081b7fffffffffffd8ef028201d8185868d8799f581cbeefbeefbeefbeefbeefbeefbeefbeefbeefbeefbeefbeefbeefbeef40581cdeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddead400a1927105820ddabe0e48f841cb5285d343b233154dabb9d7994e922baf9cc4efee28b0b0008ff825839009493315cd92eb5d8c4304e67b7e16ae36d61d34502694657811a2c8e337b62cfff6403a06a3acbc34f8c46003c69fe79a3628cefa9c47251821a00562253a1581cfd8e13e9dfd770d01eb69c18aa04468e9c7c7ad905672191c5cb48f2a15820ddabe0e48f841cb5285d343b233154dabb9d7994e922baf9cc4efee28b0b0008192328021a00056b2d031a051229b1075820bdaa99eb158414dea0a91d6c727e2268574b23efe6e08ab3b841abe8059a030c09a1581cfd8e13e9dfd770d01eb69c18aa04468e9c7c7ad905672191c5cb48f2a24150015820ddabe0e48f841cb5285d343b233154dabb9d7994e922baf9cc4efee28b0b00081b7ffffffffffffc170b58200bd35935ea3f851bf96e98f0ea4bb4007691645c61d9be3686943d7140cf6f250dd9010281825820cafecafecafecafecafecafecafecafecafecafecafecafecafecafecafecafe000ed9010281581c9493315cd92eb5d8c4304e67b7e16ae36d61d34502694657811a2c8e12d90102818258206df4fd886318af0d8248c6054ff0822e2917d46efa874152ee939f76a74e84d900a105a182010082d8799fd8799f5820cafecafecafecafecafecafecafecafecafecafecafecafecafecafecafecafe01ffff821a0008181d1a096f47d3f5d90103a0',
    )
    expect(result.txFee).toEqual(new BigNumber(355117))
  })
})
