import {describe, expect, it} from 'bun:test'
import {calculatePoolAmountAfterAddLiquidity} from '@/amm/addLiquidity'
import {buildAddLiquidityTx} from '@/onChain/transaction/buildAddLiquidityTx'
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
  userAdaAndWrtUtxo,
  userAdaOnlyUtxo,
} from './fixtures'

describe('calculatePoolAmountAfterAddLiquidity', () => {
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
    const {newPoolAmount, earnedShares} = calculatePoolAmountAfterAddLiquidity(
      poolDatum,
      poolAmount,
      new BigNumber(1_000_000),
      new BigNumber(1_000_000),
    )
    expect(newPoolAmount).toEqual([
      {unit: 'lovelace', quantity: poolOil.plus(3_000_000).toString()},
      {unit: 'deadbeef', quantity: '3000000'},
      {
        unit: `${poolValidatorHash}${poolDatum.sharesAssetName}`,
        quantity: maxShareTokens.minus(3_000_000).toString(),
      },
    ])
    expect(earnedShares.toString()).toEqual('1000000')
  })
})

describe('buildAddLiquidityTx', () => {
  const addLiquidityTxArgs = {
    network: 'preprod' as const,
    wallet: mockWallet,
    poolUtxo,
    lockA: new BigNumber(200_000),
    lockB: new BigNumber(200_000),
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
      '84a90082825820cafecafecafecafecafecafecafecafecafecafecafecafecafecafecafecafe02825820cafecafecafecafecafecafecafecafecafecafecafecafecafecafecafecafe030182a300581d70ab2299306876268c3af74d47b702f4b6697ba31413fa718a422e707d01821a01343a40a2581c659ab0b5658687c2e74cd10dba8244015b713bf503b90557769d77a7a14a57696e675269646572731a01343a40581cab2299306876268c3af74d47b702f4b6697ba31413fa718a422e707da241500158204e05861d714244c9398f61b1aff80bf4c20d6739bf7cb5f410b58a6c914d207e1b7ffffffffecbc1cd028201d8185855d8799f4040581c659ab0b5658687c2e74cd10dba8244015b713bf503b90557769d77a74a57696e675269646572730a19271058204e05861d714244c9398f61b1aff80bf4c20d6739bf7cb5f410b58a6c914d207eff825839009493315cd92eb5d8c4304e67b7e16ae36d61d34502694657811a2c8e337b62cfff6403a06a3acbc34f8c46003c69fe79a3628cefa9c47251821a0128674ea2581c659ab0b5658687c2e74cd10dba8244015b713bf503b90557769d77a7a14a57696e675269646572731a012e1fc0581cab2299306876268c3af74d47b702f4b6697ba31413fa718a422e707da158204e05861d714244c9398f61b1aff80bf4c20d6739bf7cb5f410b58a6c914d207e1a00030d4a021a0005b872031a051229b1075820bdaa99eb158414dea0a91d6c727e2268574b23efe6e08ab3b841abe8059a030c0b58208d8e866c1b4aa8b75e80803699cc48291283abcefc3c5e842afe3c30a8cc1fb70d81825820cafecafecafecafecafecafecafecafecafecafecafecafecafecafecafecafe000e81581c9493315cd92eb5d8c4304e67b7e16ae36d61d34502694657811a2c8e128182582089287140fe127b7d1e6429c720abe17fbe2a33b4a63705f3b6883284c87cb6df00a10581840000d87a9f1a00030d401a00030d40ff821a0008ff621a0a9d7713f5d90103a0',
    )
    expect(result.txFee).toEqual(new BigNumber(374898))
  })
})
