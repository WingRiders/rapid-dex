import {describe, expect, it} from 'bun:test'
import {buildSwapTx} from '@/onChain/transaction/swap'
import BigNumber from 'bignumber.js'
import {
  collateralUtxo,
  mockWallet,
  mockWalletUtxos,
  poolState,
  userAdaOnlyUtxo,
} from './fixtures'

describe('buildSwapTx', () => {
  const swapTxArgs = {
    network: 'preprod' as const,
    wallet: mockWallet,
    poolState,
    aToB: true,
    lockX: new BigNumber(200_000),
    outY: new BigNumber(219_562),
  }

  it('throws readable error when no collateral UTxO is found', () => {
    mockWalletUtxos([])
    expect(buildSwapTx(swapTxArgs)).rejects.toThrow('No collateral UTxO found')
  })

  it('throws readable error when user UTxO does not have enough funds', () => {
    mockWalletUtxos([collateralUtxo, userAdaOnlyUtxo])
    expect(
      buildSwapTx({...swapTxArgs, lockX: new BigNumber(20_000_001)}),
    ).rejects.toThrow('Not enough funds to satisfy outputs')
  })

  it('returns built transaction and fee', async () => {
    mockWalletUtxos([collateralUtxo, userAdaOnlyUtxo])

    // Fixed date for deterministic TTL in the built transaction
    const now = new Date(1740757801042)
    const result = await buildSwapTx({...swapTxArgs, now})

    expect(result.builtTx).toEqual(
      '84a900d9010282825820cafecafecafecafecafecafecafecafecafecafecafecafecafecafecafecafe01825820cafecafecafecafecafecafecafecafecafecafecafecafecafecafecafecafe020182a300583910ab2299306876268c3af74d47b702f4b6697ba31413fa718a422e707dbef7f14cde5eabb16a698e8b8f15e346b260a17b6ff26e572c06a5b701821a01343a40a2581c659ab0b5658687c2e74cd10dba8244015b713bf503b90557769d77a7a14a57696e675269646572731a012dd356581cab2299306876268c3af74d47b702f4b6697ba31413fa718a422e707da241500158204e05861d714244c9398f61b1aff80bf4c20d6739bf7cb5f410b58a6c914d207e1b7ffffffffececf17028201d8185855d8799f4040581c659ab0b5658687c2e74cd10dba8244015b713bf503b90557769d77a74a57696e675269646572730a19271058204e05861d714244c9398f61b1aff80bf4c20d6739bf7cb5f410b58a6c914d207eff825839009493315cd92eb5d8c4304e67b7e16ae36d61d34502694657811a2c8e337b62cfff6403a06a3acbc34f8c46003c69fe79a3628cefa9c47251821a01270fe0a1581c659ab0b5658687c2e74cd10dba8244015b713bf503b90557769d77a7a14a57696e675269646572731a000359aa021a00070fe0031a051229b1075820bdaa99eb158414dea0a91d6c727e2268574b23efe6e08ab3b841abe8059a030c0b582099c3629c356a2a56f01d064ae07bd7451d811c63c47c1ce4212dfa0e016754be0dd9010281825820cafecafecafecafecafecafecafecafecafecafecafecafecafecafecafecafe000ed9010281581c9493315cd92eb5d8c4304e67b7e16ae36d61d34502694657811a2c8e12d9010281825820f74ec90931a407cc641191d2aee2bea64f8168860f99ab6ce6a507636c64160f00a105a182000182d8799fd87a801a00030d40ff821a000951411a0b2c953bf5d90103a0',
    )
    expect(result.txFee).toEqual(new BigNumber(462816))
  })
})
