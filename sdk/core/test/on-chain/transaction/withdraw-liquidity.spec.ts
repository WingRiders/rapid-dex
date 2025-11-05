import {describe, expect, it} from 'bun:test'
import BigNumber from 'bignumber.js'
import {buildWithdrawLiquidityTx} from '../../../src/on-chain/transaction/withdraw-liquidity'
import {
  collateralUtxo,
  mockWallet,
  mockWalletUtxos,
  pool,
  userAdaOnlyUtxo,
  userSharesUtxo,
} from './fixtures'

describe('buildWithdrawLiquidityTx', () => {
  const withdrawLiquidityTxArgs = {
    network: 'preprod' as const,
    wallet: mockWallet,
    pool,
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
      '84a900d9010282825820cafecafecafecafecafecafecafecafecafecafecafecafecafecafecafecafe02825820cafecafecafecafecafecafecafecafecafecafecafecafecafecafecafecafe040182a300581d706801a56ce0ace009720da26f8e4a1fdf27a0ef1108736172d5e72e0701821a012e6de9a2581c659ab0b5658687c2e74cd10dba8244015b713bf503b90557769d77a7a14a57696e675269646572731a012e1fca581c6801a56ce0ace009720da26f8e4a1fdf27a0ef1108736172d5e72e07a241500158204e05861d714244c9398f61b1aff80bf4c20d6739bf7cb5f410b58a6c914d207e1b7ffffffffed1dc57028201d818585ad8799f4040581c659ab0b5658687c2e74cd10dba8244015b713bf503b90557769d77a74a57696e67526964657273d8799fff0a0a19271058204e05861d714244c9398f61b1aff80bf4c20d6739bf7cb5f410b58a6c914d207eff825839009493315cd92eb5d8c4304e67b7e16ae36d61d34502694657811a2c8e337b62cfff6403a06a3acbc34f8c46003c69fe79a3628cefa9c47251821a012c5fa9a2581c659ab0b5658687c2e74cd10dba8244015b713bf503b90557769d77a7a14a57696e675269646572731a00030d36581c6801a56ce0ace009720da26f8e4a1fdf27a0ef1108736172d5e72e07a158204e05861d714244c9398f61b1aff80bf4c20d6739bf7cb5f410b58a6c914d207e1a012e1fc0021a00078c6e031a051229b1075820bdaa99eb158414dea0a91d6c727e2268574b23efe6e08ab3b841abe8059a030c0b582088238353039a133830e37a21ee051250f384a174cdcba1d78e8860b752ecb7cd0dd9010281825820cafecafecafecafecafecafecafecafecafecafecafecafecafecafecafecafe000ed9010281581c9493315cd92eb5d8c4304e67b7e16ae36d61d34502694657811a2c8e12d9010281825820a2dcb7ed71cc92ec3bf820a14d6d9d7c7aebec3a520bbef7c9e9bf627bdec6e500a105a182000082d87b9f1a00030d40ff821a00095f111a0b233e5ff5d90103a0',
    )
    expect(result.txFee).toEqual(new BigNumber(494702))
  })
})
