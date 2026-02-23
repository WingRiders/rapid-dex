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
    ).rejects.toThrow(`authority_check ? False`)
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
      '84a900d9010282825820cafecafecafecafecafecafecafecafecafecafecafecafecafecafecafecafe02825820cafecafecafecafecafecafecafecafecafecafecafecafecafecafecafedead030182a300581d70efdb782c8c0101e4cde717d262a12741ecf3653d5e7a44d748ca4c8f01821a00e4e1c0a2581c659ab0b5658687c2e74cd10dba8244015b713bf503b90557769d77a7a14a57696e675269646572731a004c4b40581cefdb782c8c0101e4cde717d262a12741ecf3653d5e7a44d748ca4c8fa241500158204e05861d714244c9398f61b1aff80bf4c20d6739bf7cb5f410b58a6c914d207e1b7ffffffffececf17028201d818587cd8799f4040581c659ab0b5658687c2e74cd10dba8244015b713bf503b90557769d77a74a57696e675269646572730000d87980581cdeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeadbeaf4005050a0a19271058204e05861d714244c9398f61b1aff80bf4c20d6739bf7cb5f410b58a6c914d207eff825839009493315cd92eb5d8c4304e67b7e16ae36d61d34502694657811a2c8e337b62cfff6403a06a3acbc34f8c46003c69fe79a3628cefa9c47251821a017328c6a2581c659ab0b5658687c2e74cd10dba8244015b713bf503b90557769d77a7a14a57696e675269646572731a00e4e1c0581cdeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeadbeafa14001021a000a4f7a031a051229b1075820bdaa99eb158414dea0a91d6c727e2268574b23efe6e08ab3b841abe8059a030c0b5820f17cb6b5e0cda1ca7623f438e2d33b63a331a1de06e6baa025b14a383091d56e0dd9010281825820cafecafecafecafecafecafecafecafecafecafecafecafecafecafecafecafe000ed9010281581c9493315cd92eb5d8c4304e67b7e16ae36d61d34502694657811a2c8e12d9010281825820e831f89fc4250d59afd660e3d585166da765117c40744213136b62bb3bef672000a105a182000082d87c80821a000b82e91a0da7353ef5d90103a0',
    )
    expect(result.txFee).toEqual(BigNumber(675706))
  })
})
