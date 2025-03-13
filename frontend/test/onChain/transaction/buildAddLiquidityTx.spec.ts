import {describe, expect, it} from 'bun:test'
import {buildAddLiquidityTx} from '@/onChain/transaction/buildAddLiquidityTx'
import BigNumber from 'bignumber.js'
import {
  collateralUtxo,
  mockWallet,
  mockWalletUtxos,
  poolState,
  userAdaAndWrtUtxo,
  userAdaOnlyUtxo,
} from './fixtures'

describe('buildAddLiquidityTx', () => {
  const addLiquidityTxArgs = {
    network: 'preprod' as const,
    wallet: mockWallet,
    poolState,
    lockA: new BigNumber(200_000),
    lockB: new BigNumber(200_000),
    earnedShares: new BigNumber(200_010),
  }

  it('throws readable error when no collateral UTxO is found', () => {
    mockWalletUtxos([])
    expect(buildAddLiquidityTx(addLiquidityTxArgs)).rejects.toThrow(
      'No collateral UTxO found',
    )
  })

  it('throws readable error when user UTxO does not have enough funds', () => {
    mockWalletUtxos([collateralUtxo, userAdaOnlyUtxo])
    expect(
      buildAddLiquidityTx({
        ...addLiquidityTxArgs,
        lockA: new BigNumber(20_000_001),
      }),
    ).rejects.toThrow('Not enough funds to satisfy outputs')
  })

  it('returns built transaction and fee', async () => {
    mockWalletUtxos([collateralUtxo, userAdaAndWrtUtxo])

    // Fixed date for deterministic TTL in the built transaction
    const now = new Date(1740757801042)
    const result = await buildAddLiquidityTx({...addLiquidityTxArgs, now})

    expect(result.builtTx).toEqual(
      '84a900d9010282825820cafecafecafecafecafecafecafecafecafecafecafecafecafecafecafecafe02825820cafecafecafecafecafecafecafecafecafecafecafecafecafecafecafecafe030182a300583910ab2299306876268c3af74d47b702f4b6697ba31413fa718a422e707dbef7f14cde5eabb16a698e8b8f15e346b260a17b6ff26e572c06a5b701821a01343a40a2581c659ab0b5658687c2e74cd10dba8244015b713bf503b90557769d77a7a14a57696e675269646572731a01343a40581cab2299306876268c3af74d47b702f4b6697ba31413fa718a422e707da241500158204e05861d714244c9398f61b1aff80bf4c20d6739bf7cb5f410b58a6c914d207e1b7ffffffffecbc1cd028201d8185855d8799f4040581c659ab0b5658687c2e74cd10dba8244015b713bf503b90557769d77a74a57696e675269646572730a19271058204e05861d714244c9398f61b1aff80bf4c20d6739bf7cb5f410b58a6c914d207eff825839009493315cd92eb5d8c4304e67b7e16ae36d61d34502694657811a2c8e337b62cfff6403a06a3acbc34f8c46003c69fe79a3628cefa9c47251821a01270abba2581c659ab0b5658687c2e74cd10dba8244015b713bf503b90557769d77a7a14a57696e675269646572731a012e1fc0581cab2299306876268c3af74d47b702f4b6697ba31413fa718a422e707da158204e05861d714244c9398f61b1aff80bf4c20d6739bf7cb5f410b58a6c914d207e1a00030d4a021a00071505031a051229b1075820bdaa99eb158414dea0a91d6c727e2268574b23efe6e08ab3b841abe8059a030c0b582054ccfa6dba9bc7e3bcca3fb6b140d1861dad94a350fd5c41630bdd73491daa470dd9010281825820cafecafecafecafecafecafecafecafecafecafecafecafecafecafecafecafe000ed9010281581c9493315cd92eb5d8c4304e67b7e16ae36d61d34502694657811a2c8e12d9010281825820f74ec90931a407cc641191d2aee2bea64f8168860f99ab6ce6a507636c64160f00a105a182000082d87a9f1a00030d401a00030d40ff821a0008ff621a0aa4ca81f5d90103a0',
    )
    expect(result.txFee).toEqual(new BigNumber(464133))
  })
})
