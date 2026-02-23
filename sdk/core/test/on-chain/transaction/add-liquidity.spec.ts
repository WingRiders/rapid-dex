import {describe, expect, it} from 'bun:test'
import BigNumber from 'bignumber.js'
import {buildAddLiquidityTx} from '../../../src/on-chain/transaction/add-liquidity'
import {
  collateralUtxo,
  mockWallet,
  mockWalletUtxos,
  pool,
  userAdaAndWrtUtxo,
  userAdaOnlyUtxo,
} from './fixtures'

describe('buildAddLiquidityTx', () => {
  const addLiquidityTxArgs = {
    network: 'preprod' as const,
    wallet: mockWallet,
    pool,
    lockA: new BigNumber(200_000),
    lockB: new BigNumber(200_000),
    earnedShares: new BigNumber(200_010),
    xSwap: new BigNumber(0),
    addToTreasuryA: new BigNumber(0),
    addToTreasuryB: new BigNumber(0),
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
    ).rejects.toThrow('UTxO Balance Insufficient')
  })

  it('returns built transaction and fee', async () => {
    mockWalletUtxos([collateralUtxo, userAdaAndWrtUtxo])

    // Fixed date for deterministic TTL in the built transaction
    const now = new Date(1740757801042)
    const result = await buildAddLiquidityTx({...addLiquidityTxArgs, now})

    expect(result.builtTx).toEqual(
      '84a900d9010282825820cafecafecafecafecafecafecafecafecafecafecafecafecafecafecafecafe02825820cafecafecafecafecafecafecafecafecafecafecafecafecafecafecafecafe030182a300581d70efdb782c8c0101e4cde717d262a12741ecf3653d5e7a44d748ca4c8f01821a01343a40a2581c659ab0b5658687c2e74cd10dba8244015b713bf503b90557769d77a7a14a57696e675269646572731a01343a40581cefdb782c8c0101e4cde717d262a12741ecf3653d5e7a44d748ca4c8fa241500158204e05861d714244c9398f61b1aff80bf4c20d6739bf7cb5f410b58a6c914d207e1b7ffffffffecbc1cd028201d8185886d8799f4040581c659ab0b5658687c2e74cd10dba8244015b713bf503b90557769d77a74a57696e675269646572730000d87980581c659ab0b5658687c2e74cd10dba8244015b713bf503b90557769d77a74a57696e6752696465727305050a0a19271058204e05861d714244c9398f61b1aff80bf4c20d6739bf7cb5f410b58a6c914d207eff825839009493315cd92eb5d8c4304e67b7e16ae36d61d34502694657811a2c8e337b62cfff6403a06a3acbc34f8c46003c69fe79a3628cefa9c47251821a0123e8d0a2581c659ab0b5658687c2e74cd10dba8244015b713bf503b90557769d77a7a14a57696e675269646572731a012e1fc0581cefdb782c8c0101e4cde717d262a12741ecf3653d5e7a44d748ca4c8fa158204e05861d714244c9398f61b1aff80bf4c20d6739bf7cb5f410b58a6c914d207e1a00030d4a021a000a36f0031a051229b1075820bdaa99eb158414dea0a91d6c727e2268574b23efe6e08ab3b841abe8059a030c0b5820e9c6d7f7eaf3e77f453b85a17cfcfb1cb2179f853a30cae5ef3f848797919f8e0dd9010281825820cafecafecafecafecafecafecafecafecafecafecafecafecafecafecafecafe000ed9010281581c9493315cd92eb5d8c4304e67b7e16ae36d61d34502694657811a2c8e12d9010281825820e831f89fc4250d59afd660e3d585166da765117c40744213136b62bb3bef672000a105a182000082d87a9f1a00030d401a00030d4000ff821a0009cf5f1a0ba1d8dbf5d90103a0',
    )
    expect(result.txFee).toEqual(new BigNumber(669424))
  })
})
