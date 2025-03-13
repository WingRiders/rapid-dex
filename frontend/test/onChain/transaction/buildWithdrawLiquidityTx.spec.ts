import {describe, expect, it} from 'bun:test'
import {calculatePoolAmountAfterWithdrawLiquidity} from '@/amm/withdrawLiquidity'
import {buildWithdrawLiquidityTx} from '@/onChain/transaction/buildWithdrawLiquidity'
import {
  type PoolDatum,
  maxShareTokens,
  poolOil,
  poolValidatorHash,
} from '@wingriders/rapid-dex-common'
import BigNumber from 'bignumber.js'
import {
  collateralUtxo,
  mockWallet,
  mockWalletUtxos,
  poolUtxo,
  userAdaOnlyUtxo,
  userSharesUtxo,
} from './fixtures'

describe('calculatePoolAmountAfterWithdrawLiquidity', () => {
  it('works', () => {
    const poolDatum: PoolDatum = {
      aPolicyId: '',
      aAssetName: '',
      bPolicyId: 'dead',
      bAssetName: 'beef',
      swapFeePoints: 1,
      feeBasis: 10,
      sharesAssetName: 'cafe',
    }
    const poolAmount = [
      {unit: 'lovelace', quantity: poolOil.plus(2_000_000).toString()},
      {unit: 'deadbeef', quantity: '2000000'},
      {
        unit: `${poolValidatorHash}${poolDatum.sharesAssetName}`,
        quantity: maxShareTokens.minus(2_000_000).toString(),
      },
    ]
    const {newPoolAmount, returnedA, returnedB} =
      calculatePoolAmountAfterWithdrawLiquidity(
        poolDatum,
        poolAmount,
        new BigNumber(1_000_000),
      )
    expect(newPoolAmount).toEqual([
      {unit: 'lovelace', quantity: poolOil.plus(1_000_000).toString()},
      {unit: 'deadbeef', quantity: '1000000'},
      {
        unit: `${poolValidatorHash}${poolDatum.sharesAssetName}`,
        quantity: maxShareTokens.minus(1_000_000).toString(),
      },
    ])
    expect(returnedA.toString()).toEqual('1000000')
    expect(returnedB.toString()).toEqual('1000000')
  })
})

describe('buildWithdrawLiquidityTx', () => {
  const withdrawLiquidityTxArgs = {
    network: 'preprod' as const,
    wallet: mockWallet,
    poolUtxo,
    lockShares: new BigNumber(200_000),
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
      '84a900d9010282825820cafecafecafecafecafecafecafecafecafecafecafecafecafecafecafecafe02825820cafecafecafecafecafecafecafecafecafecafecafecafecafecafecafecafe040182a300581d70ab2299306876268c3af74d47b702f4b6697ba31413fa718a422e707d01821a012e6de9a2581c659ab0b5658687c2e74cd10dba8244015b713bf503b90557769d77a7a14a57696e675269646572731a012e1fca581cab2299306876268c3af74d47b702f4b6697ba31413fa718a422e707da241500158204e05861d714244c9398f61b1aff80bf4c20d6739bf7cb5f410b58a6c914d207e1b7ffffffffed1dc57028201d8185855d8799f4040581c659ab0b5658687c2e74cd10dba8244015b713bf503b90557769d77a74a57696e675269646572730a19271058204e05861d714244c9398f61b1aff80bf4c20d6739bf7cb5f410b58a6c914d207eff825839009493315cd92eb5d8c4304e67b7e16ae36d61d34502694657811a2c8e337b62cfff6403a06a3acbc34f8c46003c69fe79a3628cefa9c47251821a012cde56a2581c659ab0b5658687c2e74cd10dba8244015b713bf503b90557769d77a7a14a57696e675269646572731a00030d36581cab2299306876268c3af74d47b702f4b6697ba31413fa718a422e707da158204e05861d714244c9398f61b1aff80bf4c20d6739bf7cb5f410b58a6c914d207e1a012e1fc0021a00070dc1031a051229b1075820bdaa99eb158414dea0a91d6c727e2268574b23efe6e08ab3b841abe8059a030c0b5820c57f503d18fe82e666023eb31e3ed1b7e2400cb6a3c2388c9f1d24cae1c883ce0dd9010281825820cafecafecafecafecafecafecafecafecafecafecafecafecafecafecafecafe000ed9010281581c9493315cd92eb5d8c4304e67b7e16ae36d61d34502694657811a2c8e12d9010281825820f74ec90931a407cc641191d2aee2bea64f8168860f99ab6ce6a507636c64160f00a105a182000082d87b9f1a00030d40ff821a0008ec3e1a0a8a69dff5d90103a0',
    )
    expect(result.txFee).toEqual(new BigNumber(462273))
  })
})
