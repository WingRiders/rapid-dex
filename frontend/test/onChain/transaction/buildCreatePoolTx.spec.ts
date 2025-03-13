import {describe, expect, it, mock} from 'bun:test'
import {buildCreatePoolTx} from '@/onChain/transaction/buildCreatePoolTx'
import {NetworkId} from '@wingriders/rapid-dex-common'
import {BigNumber} from 'bignumber.js'
import {
  address,
  assetA,
  assetB,
  collateralUtxo,
  mockWallet,
  seedUtxo,
} from './fixtures'

const createPoolTxParams = {
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
  it('throws error when no collateral UTxO is found', () => {
    mockWallet.getUtxos = mock(() => Promise.resolve([]))

    expect(buildCreatePoolTx(createPoolTxParams)).rejects.toThrow(
      'No collateral UTxO found',
    )
  })

  it('throws error when seed UTxO is missing in the wallet', () => {
    mockWallet.getUtxos = mock(() => Promise.resolve([collateralUtxo]))
    mockWallet.getChangeAddress = mock(() => Promise.resolve(address))
    mockWallet.getNetworkId = mock(() => Promise.resolve(NetworkId.TESTNET))

    expect(buildCreatePoolTx(createPoolTxParams)).rejects.toThrow(
      "Couldn't find value information for cafecafecafecafecafecafecafecafecafecafecafecafecafecafecafecafe#1",
    )
  })

  it('throws error when assetA and assetB are the same', () => {
    mockWallet.getUtxos = mock(() =>
      Promise.resolve([collateralUtxo, seedUtxo]),
    )
    mockWallet.getChangeAddress = mock(() => Promise.resolve(address))
    mockWallet.getNetworkId = mock(() => Promise.resolve(NetworkId.TESTNET))
    expect(() =>
      buildCreatePoolTx({...createPoolTxParams, assetB: assetA}),
    ).toThrow(/^Tx evaluation failed: {} \n For txHex: [0-9a-fA-F]+$/)
  })

  it('returns built transaction and fee', async () => {
    mockWallet.getUtxos = mock(() =>
      Promise.resolve([collateralUtxo, seedUtxo]),
    )
    mockWallet.getChangeAddress = mock(() => Promise.resolve(address))

    // Fixed date for deterministic TTL in the built transaction
    const now = new Date(1740757801042)
    const result = await buildCreatePoolTx({...createPoolTxParams, now})

    expect(result.builtTx).toEqual(
      '84aa0081825820cafecafecafecafecafecafecafecafecafecafecafecafecafecafecafecafe010182a300581d70ab2299306876268c3af74d47b702f4b6697ba31413fa718a422e707d01821a001e8480a3581cab2299306876268c3af74d47b702f4b6697ba31413fa718a422e707da24150015820ddabe0e48f841cb5285d343b233154dabb9d7994e922baf9cc4efee28b0b00081b7fffffffffffd8ef581cbeefbeefbeefbeefbeefbeefbeefbeefbeefbeefbeefbeefbeefbeefa140192710581cdeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeada140192710028201d8185868d8799f581cbeefbeefbeefbeefbeefbeefbeefbeefbeefbeefbeefbeefbeefbeef40581cdeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddead400a1927105820ddabe0e48f841cb5285d343b233154dabb9d7994e922baf9cc4efee28b0b0008ff825839009493315cd92eb5d8c4304e67b7e16ae36d61d34502694657811a2c8e337b62cfff6403a06a3acbc34f8c46003c69fe79a3628cefa9c47251821a0055f0f1a1581cab2299306876268c3af74d47b702f4b6697ba31413fa718a422e707da15820ddabe0e48f841cb5285d343b233154dabb9d7994e922baf9cc4efee28b0b0008192328021a00059c8f031a051229b1075820bdaa99eb158414dea0a91d6c727e2268574b23efe6e08ab3b841abe8059a030c09a1581cab2299306876268c3af74d47b702f4b6697ba31413fa718a422e707da24150015820ddabe0e48f841cb5285d343b233154dabb9d7994e922baf9cc4efee28b0b00081b7ffffffffffffc170b58205a1759a2b5374776edf2ca6bb7993867f0d250683cec9200b9eace4198cc857b0d81825820cafecafecafecafecafecafecafecafecafecafecafecafecafecafecafecafe000e81581c9493315cd92eb5d8c4304e67b7e16ae36d61d34502694657811a2c8e128182582089287140fe127b7d1e6429c720abe17fbe2a33b4a63705f3b6883284c87cb6df00a1058184010080821a000776261a08ad9ed5f5d90103a0',
    )
    expect(result.txFee).toEqual(new BigNumber(367759))
  })
})
