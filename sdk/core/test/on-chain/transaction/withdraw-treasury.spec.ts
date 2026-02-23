import {describe, expect, it} from 'bun:test'
import BigNumber from 'bignumber.js'
import {buildWithdrawTreasuryTx} from '../../../src/on-chain/transaction/withdraw-treasury'
import {
  collateralUtxo,
  mockWallet,
  mockWalletUtxos,
  poolWithTreasury,
  userAdaAndTreasuryAuthorityUtxo,
  userAdaOnlyUtxo,
} from './fixtures'

describe('buildWithdrawTreasuryTx', () => {
  const withdrawTreasuryTxArgs = {
    network: 'preprod' as const,
    wallet: mockWallet,
    pool: poolWithTreasury,
    treasuryAuthorityUtxo: userAdaAndTreasuryAuthorityUtxo,
  }

  it('throws readable error when no collateral UTxO is found', () => {
    mockWalletUtxos([])
    expect(buildWithdrawTreasuryTx(withdrawTreasuryTxArgs)).rejects.toThrow(
      'No collateral UTxO found',
    )
  })

  it('throws readable error when user UTxO is missing treasury authority token', () => {
    mockWalletUtxos([collateralUtxo, userAdaOnlyUtxo])
    expect(
      buildWithdrawTreasuryTx({
        ...withdrawTreasuryTxArgs,
        treasuryAuthorityUtxo: userAdaOnlyUtxo,
      }),
    ).rejects.toThrow('Tx evaluation failed')
  })

  it('returns built transaction and fee', async () => {
    mockWalletUtxos([collateralUtxo, userAdaAndTreasuryAuthorityUtxo])

    // Fixed date for deterministic TTL in the built transaction
    const now = new Date(1740757801042)
    const result = await buildWithdrawTreasuryTx({
      ...withdrawTreasuryTxArgs,
      now,
    })

    expect(result.builtTx).toEqual(
      '84a900d9010282825820cafecafecafecafecafecafecafecafecafecafecafecafecafecafecafecafe02825820cafecafecafecafecafecafecafecafecafecafecafecafecafecafecafedead030182a300581d70348225d4082c67eacf432a261f1b128a2411be18a2a4c3860974d47301821a00e4e1c0a2581c348225d4082c67eacf432a261f1b128a2411be18a2a4c3860974d473a241500158204e05861d714244c9398f61b1aff80bf4c20d6739bf7cb5f410b58a6c914d207e1b7ffffffffececf17581c659ab0b5658687c2e74cd10dba8244015b713bf503b90557769d77a7a14a57696e675269646572731a004c4b40028201d818587cd8799f4040581c659ab0b5658687c2e74cd10dba8244015b713bf503b90557769d77a74a57696e675269646572730000d87980581cdeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeadbeaf4005050a0a19271058204e05861d714244c9398f61b1aff80bf4c20d6739bf7cb5f410b58a6c914d207eff825839009493315cd92eb5d8c4304e67b7e16ae36d61d34502694657811a2c8e337b62cfff6403a06a3acbc34f8c46003c69fe79a3628cefa9c47251821a0176c9c9a2581c659ab0b5658687c2e74cd10dba8244015b713bf503b90557769d77a7a14a57696e675269646572731a00e4e1c0581cdeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeadbeafa14001021a0006ae77031a051229b1075820bdaa99eb158414dea0a91d6c727e2268574b23efe6e08ab3b841abe8059a030c0b5820f49250435b25b5ebb3311506e58c2eea6c7b16f036f46035e1bb8804efd7982b0dd9010281825820cafecafecafecafecafecafecafecafecafecafecafecafecafecafecafecafe000ed9010281581c9493315cd92eb5d8c4304e67b7e16ae36d61d34502694657811a2c8e12d9010281825820cc1a925fb3ba0cd2f7e8ff8ab2bd8ac2f1b990b5a56a18034e15804302da345c00a105a182000082d87c80821a0009eb711a0c1cb136f5d90103a0',
    )
    expect(result.txFee).toEqual(BigNumber(437879))
  })
})
