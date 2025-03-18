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
      '84a900d9010282825820cafecafecafecafecafecafecafecafecafecafecafecafecafecafecafecafe01825820cafecafecafecafecafecafecafecafecafecafecafecafecafecafecafecafe020182a300583910fd8e13e9dfd770d01eb69c18aa04468e9c7c7ad905672191c5cb48f2b301ca25899116edef9065b0ecbab42deba3e351916f534df20173c601821a01343a40a2581c659ab0b5658687c2e74cd10dba8244015b713bf503b90557769d77a7a14a57696e675269646572731a012dd356581cfd8e13e9dfd770d01eb69c18aa04468e9c7c7ad905672191c5cb48f2a241500158204e05861d714244c9398f61b1aff80bf4c20d6739bf7cb5f410b58a6c914d207e1b7ffffffffececf17028201d8185855d8799f4040581c659ab0b5658687c2e74cd10dba8244015b713bf503b90557769d77a74a57696e675269646572730a19271058204e05861d714244c9398f61b1aff80bf4c20d6739bf7cb5f410b58a6c914d207eff825839009493315cd92eb5d8c4304e67b7e16ae36d61d34502694657811a2c8e337b62cfff6403a06a3acbc34f8c46003c69fe79a3628cefa9c47251821a0126f5e3a1581c659ab0b5658687c2e74cd10dba8244015b713bf503b90557769d77a7a14a57696e675269646572731a000359aa021a000729dd031a051229b1075820bdaa99eb158414dea0a91d6c727e2268574b23efe6e08ab3b841abe8059a030c0b5820620df14ddede6ff6380620bfb8f0424ad72594310d632141144aeb1ec9f027cc0dd9010281825820cafecafecafecafecafecafecafecafecafecafecafecafecafecafecafecafe000ed9010281581c9493315cd92eb5d8c4304e67b7e16ae36d61d34502694657811a2c8e12d9010281825820657ca80af0739bd019ef4ee462a1994f23a4b6133a45820007c7cca6d14f02fe00a105a182000182d8799fd87a801a00030d40ff821a0009528b1a0b2d637bf5d90103a0',
    )
    expect(result.txFee).toEqual(new BigNumber(469469))
  })
})
