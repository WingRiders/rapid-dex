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
      '84aa0081825820cafecafecafecafecafecafecafecafecafecafecafecafecafecafecafecafe010182a300581d70e209f2f90f06c8f68c3df99a77b66a23a510fe609992449afa5ac24801821a001e8480a3581cbeefbeefbeefbeefbeefbeefbeefbeefbeefbeefbeefbeefbeefbeefa140192710581cdeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeada140192710581ce209f2f90f06c8f68c3df99a77b66a23a510fe609992449afa5ac248a24150015820ddabe0e48f841cb5285d343b233154dabb9d7994e922baf9cc4efee28b0b00081b7fffffffffffd8ef028201d8185868d8799f581cbeefbeefbeefbeefbeefbeefbeefbeefbeefbeefbeefbeefbeefbeef40581cdeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddead400a1927105820ddabe0e48f841cb5285d343b233154dabb9d7994e922baf9cc4efee28b0b0008ff825839009493315cd92eb5d8c4304e67b7e16ae36d61d34502694657811a2c8e337b62cfff6403a06a3acbc34f8c46003c69fe79a3628cefa9c47251821a005724eba1581ce209f2f90f06c8f68c3df99a77b66a23a510fe609992449afa5ac248a15820ddabe0e48f841cb5285d343b233154dabb9d7994e922baf9cc4efee28b0b0008192328021a00046895031a051229b1075820bdaa99eb158414dea0a91d6c727e2268574b23efe6e08ab3b841abe8059a030c09a1581ce209f2f90f06c8f68c3df99a77b66a23a510fe609992449afa5ac248a24150015820ddabe0e48f841cb5285d343b233154dabb9d7994e922baf9cc4efee28b0b00081b7ffffffffffffc170b58207dc3bb1bf78693fff1ac1d110dd9f427f29cbe56b6e50dc5ae5f974beaa0a0d00d81825820cafecafecafecafecafecafecafecafecafecafecafecafecafecafecafecafe000e81581c9493315cd92eb5d8c4304e67b7e16ae36d61d34502694657811a2c8e1281825820aa4181b52ca1acc14ac67dd521b0385e8351c6cfeba82e0b8abc6f0d06a409c400a1058184010080821a000701cc1a08482b8af5d90103a0',
    )
    expect(result.txFee).toEqual(new BigNumber(288917))
  })
})
