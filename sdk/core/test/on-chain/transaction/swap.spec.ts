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
    ).rejects.toThrow('UTxO Balance Insufficient')
  })

  it('returns built transaction and fee', async () => {
    mockWalletUtxos([collateralUtxo, userAdaOnlyUtxo])

    // Fixed date for deterministic TTL in the built transaction
    const now = new Date(1740757801042)

    const outY = new BigNumber(219_454)
    const result = await buildSwapTx({
      ...swapTxArgs,
      outY,
      addToTreasuryA: new BigNumber(100),
      now,
    })

    expect(result.builtTx).toEqual(
      '84a900d9010282825820cafecafecafecafecafecafecafecafecafecafecafecafecafecafecafecafe01825820cafecafecafecafecafecafecafecafecafecafecafecafecafecafecafecafe020182a300581d70348225d4082c67eacf432a261f1b128a2411be18a2a4c3860974d47301821a01343a40a2581c348225d4082c67eacf432a261f1b128a2411be18a2a4c3860974d473a241500158204e05861d714244c9398f61b1aff80bf4c20d6739bf7cb5f410b58a6c914d207e1b7ffffffffececf17581c659ab0b5658687c2e74cd10dba8244015b713bf503b90557769d77a7a14a57696e675269646572731a012dd3c2028201d8185887d8799f4040581c659ab0b5658687c2e74cd10dba8244015b713bf503b90557769d77a74a57696e67526964657273186400d87980581c659ab0b5658687c2e74cd10dba8244015b713bf503b90557769d77a74a57696e6752696465727305050a0a19271058204e05861d714244c9398f61b1aff80bf4c20d6739bf7cb5f410b58a6c914d207eff825839009493315cd92eb5d8c4304e67b7e16ae36d61d34502694657811a2c8e337b62cfff6403a06a3acbc34f8c46003c69fe79a3628cefa9c47251821a01277cf3a1581c659ab0b5658687c2e74cd10dba8244015b713bf503b90557769d77a7a14a57696e675269646572731a0003593e021a0006a2cd031a051229b1075820bdaa99eb158414dea0a91d6c727e2268574b23efe6e08ab3b841abe8059a030c0b582061ed3ca17a73921bffc0e4e48cd0dc5329c3d55cabf85b68a8de23e7719645750dd9010281825820cafecafecafecafecafecafecafecafecafecafecafecafecafecafecafecafe000ed9010281581c9493315cd92eb5d8c4304e67b7e16ae36d61d34502694657811a2c8e12d9010281825820cc1a925fb3ba0cd2f7e8ff8ab2bd8ac2f1b990b5a56a18034e15804302da345c00a105a182000182d8799fd87a801a00030d40ff821a00096d951a0ba7447bf5d90103a0',
    )
    expect(result.txFee).toEqual(new BigNumber(434893))
  })
})
