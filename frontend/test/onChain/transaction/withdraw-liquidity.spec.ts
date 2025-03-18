import {describe, expect, it} from 'bun:test'
import {buildWithdrawLiquidityTx} from '@/onChain/transaction/withdraw-liquidity'
import BigNumber from 'bignumber.js'
import {
  collateralUtxo,
  mockWallet,
  mockWalletUtxos,
  poolState,
  userAdaOnlyUtxo,
  userSharesUtxo,
} from './fixtures'

describe('buildWithdrawLiquidityTx', () => {
  const withdrawLiquidityTxArgs = {
    network: 'preprod' as const,
    wallet: mockWallet,
    poolState,
    lockShares: new BigNumber(200_000),
    outA: new BigNumber(179_991),
    outB: new BigNumber(199_990),
  }

  it('throws readable error when no collateral UTxO is found', () => {
    mockWalletUtxos([])
    expect(buildWithdrawLiquidityTx(withdrawLiquidityTxArgs)).rejects.toThrow(
      'No collateral UTxO found',
    )
  })

  it('throws readable error when user UTxO does not have enough funds', () => {
    mockWalletUtxos([collateralUtxo, userAdaOnlyUtxo])
    expect(buildWithdrawLiquidityTx(withdrawLiquidityTxArgs)).rejects.toThrow(
      'Not enough funds to satisfy outputs',
    )
  })

  it('returns built transaction and fee', async () => {
    mockWalletUtxos([collateralUtxo, userSharesUtxo])

    // Fixed date for deterministic TTL in the built transaction
    const now = new Date(1740757801042)
    const result = await buildWithdrawLiquidityTx({
      ...withdrawLiquidityTxArgs,
      now,
    })

    expect(result.builtTx).toEqual(
      '84a900d9010282825820cafecafecafecafecafecafecafecafecafecafecafecafecafecafecafecafe02825820cafecafecafecafecafecafecafecafecafecafecafecafecafecafecafecafe040182a300583910fd8e13e9dfd770d01eb69c18aa04468e9c7c7ad905672191c5cb48f2b301ca25899116edef9065b0ecbab42deba3e351916f534df20173c601821a012e6de9a2581c659ab0b5658687c2e74cd10dba8244015b713bf503b90557769d77a7a14a57696e675269646572731a012e1fca581cfd8e13e9dfd770d01eb69c18aa04468e9c7c7ad905672191c5cb48f2a241500158204e05861d714244c9398f61b1aff80bf4c20d6739bf7cb5f410b58a6c914d207e1b7ffffffffed1dc57028201d8185855d8799f4040581c659ab0b5658687c2e74cd10dba8244015b713bf503b90557769d77a74a57696e675269646572730a19271058204e05861d714244c9398f61b1aff80bf4c20d6739bf7cb5f410b58a6c914d207eff825839009493315cd92eb5d8c4304e67b7e16ae36d61d34502694657811a2c8e337b62cfff6403a06a3acbc34f8c46003c69fe79a3628cefa9c47251821a012cbf66a2581c659ab0b5658687c2e74cd10dba8244015b713bf503b90557769d77a7a14a57696e675269646572731a00030d36581cfd8e13e9dfd770d01eb69c18aa04468e9c7c7ad905672191c5cb48f2a158204e05861d714244c9398f61b1aff80bf4c20d6739bf7cb5f410b58a6c914d207e1a012e1fc0021a00072cb1031a051229b1075820bdaa99eb158414dea0a91d6c727e2268574b23efe6e08ab3b841abe8059a030c0b58208d1f70a3a108237a55fadc9ddb2dad0b43134e73eaa9fda631f4965d63829ba80dd9010281825820cafecafecafecafecafecafecafecafecafecafecafecafecafecafecafecafe000ed9010281581c9493315cd92eb5d8c4304e67b7e16ae36d61d34502694657811a2c8e12d9010281825820657ca80af0739bd019ef4ee462a1994f23a4b6133a45820007c7cca6d14f02fe00a105a182000082d87b9f1a00030d40ff821a0008ed881a0a928b8df5d90103a0',
    )
    expect(result.txFee).toEqual(new BigNumber(470193))
  })
})
