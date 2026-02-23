import {describe, expect, it} from 'bun:test'
import BigNumber from 'bignumber.js'
import {
  type BuildWithdrawLiquidityTxArgs,
  buildWithdrawLiquidityTx,
} from '../../../src/on-chain/transaction/withdraw-liquidity'
import {
  collateralUtxo,
  mockWallet,
  mockWalletUtxos,
  pool,
  userAdaOnlyUtxo,
  userSharesUtxo,
} from './fixtures'

describe('buildWithdrawLiquidityTx', () => {
  const withdrawLiquidityTxArgs: BuildWithdrawLiquidityTxArgs = {
    wallet: mockWallet,
    pool,
    lockShares: new BigNumber(200_000),
    outA: new BigNumber(179_991),
    outB: new BigNumber(199_990),
    withdrawType: 'TO_BOTH',
    addToTreasuryA: new BigNumber(0),
    addToTreasuryB: new BigNumber(0),
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
      'UTxO Balance Insufficient',
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
      '84a900d9010282825820cafecafecafecafecafecafecafecafecafecafecafecafecafecafecafecafe02825820cafecafecafecafecafecafecafecafecafecafecafecafecafecafecafecafe040182a300581d70348225d4082c67eacf432a261f1b128a2411be18a2a4c3860974d47301821a012e6de9a2581c348225d4082c67eacf432a261f1b128a2411be18a2a4c3860974d473a241500158204e05861d714244c9398f61b1aff80bf4c20d6739bf7cb5f410b58a6c914d207e1b7ffffffffed1dc57581c659ab0b5658687c2e74cd10dba8244015b713bf503b90557769d77a7a14a57696e675269646572731a012e1fca028201d8185886d8799f4040581c659ab0b5658687c2e74cd10dba8244015b713bf503b90557769d77a74a57696e675269646572730000d87980581c659ab0b5658687c2e74cd10dba8244015b713bf503b90557769d77a74a57696e6752696465727305050a0a19271058204e05861d714244c9398f61b1aff80bf4c20d6739bf7cb5f410b58a6c914d207eff825839009493315cd92eb5d8c4304e67b7e16ae36d61d34502694657811a2c8e337b62cfff6403a06a3acbc34f8c46003c69fe79a3628cefa9c47251821a012d59fda2581c348225d4082c67eacf432a261f1b128a2411be18a2a4c3860974d473a158204e05861d714244c9398f61b1aff80bf4c20d6739bf7cb5f410b58a6c914d207e1a012e1fc0581c659ab0b5658687c2e74cd10dba8244015b713bf503b90557769d77a7a14a57696e675269646572731a00030d36021a0006921a031a051229b1075820bdaa99eb158414dea0a91d6c727e2268574b23efe6e08ab3b841abe8059a030c0b5820e4a8b6c5fe30269e7fbc9e9c95cc268b74d4662b5e9b739dab70303bc87039f10dd9010281825820cafecafecafecafecafecafecafecafecafecafecafecafecafecafecafecafe000ed9010281581c9493315cd92eb5d8c4304e67b7e16ae36d61d34502694657811a2c8e12d9010281825820cc1a925fb3ba0cd2f7e8ff8ab2bd8ac2f1b990b5a56a18034e15804302da345c00a105a182000082d87b9f1a00030d40d87980ff821a00080a601a09f24105f5d90103a0',
    )
    expect(result.txFee).toEqual(new BigNumber(430618))
  })
})
