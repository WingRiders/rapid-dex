import {describe, expect, it} from 'bun:test'
import BigNumber from 'bignumber.js'
import {buildSwapTx} from '../../../src/on-chain/transaction/swap'
import {
  collateralUtxo,
  mockWallet,
  mockWalletUtxos,
  pool,
  userAdaOnlyUtxo,
} from './fixtures'

describe('buildSwapTx', () => {
  const swapTxArgs = {
    network: 'preprod' as const,
    wallet: mockWallet,
    pool,
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
      '84a900d9010282825820cafecafecafecafecafecafecafecafecafecafecafecafecafecafecafecafe01825820cafecafecafecafecafecafecafecafecafecafecafecafecafecafecafecafe020182a300581d706801a56ce0ace009720da26f8e4a1fdf27a0ef1108736172d5e72e0701821a01343a40a2581c659ab0b5658687c2e74cd10dba8244015b713bf503b90557769d77a7a14a57696e675269646572731a012dd356581c6801a56ce0ace009720da26f8e4a1fdf27a0ef1108736172d5e72e07a241500158204e05861d714244c9398f61b1aff80bf4c20d6739bf7cb5f410b58a6c914d207e1b7ffffffffececf17028201d818585ad8799f4040581c659ab0b5658687c2e74cd10dba8244015b713bf503b90557769d77a74a57696e67526964657273d8799fff0a0a19271058204e05861d714244c9398f61b1aff80bf4c20d6739bf7cb5f410b58a6c914d207eff825839009493315cd92eb5d8c4304e67b7e16ae36d61d34502694657811a2c8e337b62cfff6403a06a3acbc34f8c46003c69fe79a3628cefa9c47251821a01269439a1581c659ab0b5658687c2e74cd10dba8244015b713bf503b90557769d77a7a14a57696e675269646572731a000359aa021a00078b87031a051229b1075820bdaa99eb158414dea0a91d6c727e2268574b23efe6e08ab3b841abe8059a030c0b58204ce4284219cd0fb58916b8714b1acb43f82bcfd082bac2ba1c505470729bd61a0dd9010281825820cafecafecafecafecafecafecafecafecafecafecafecafecafecafecafecafe000ed9010281581c9493315cd92eb5d8c4304e67b7e16ae36d61d34502694657811a2c8e12d9010281825820a2dcb7ed71cc92ec3bf820a14d6d9d7c7aebec3a520bbef7c9e9bf627bdec6e500a105a182000182d8799fd87a801a00030d40ff821a0009dba51a0bdcd1fff5d90103a0',
    )
    expect(result.txFee).toEqual(new BigNumber(494471))
  })
})
