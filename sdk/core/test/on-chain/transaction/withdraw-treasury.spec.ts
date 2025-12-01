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
      '84a900d9010282825820cafecafecafecafecafecafecafecafecafecafecafecafecafecafecafecafe02825820cafecafecafecafecafecafecafecafecafecafecafecafecafecafecafedead030182a300581d70e1bab9966010c5c952e143697e00e3627b5981b111362a437a0150ee01821a00e4e1c0a2581c659ab0b5658687c2e74cd10dba8244015b713bf503b90557769d77a7a14a57696e675269646572731a004c4b40581ce1bab9966010c5c952e143697e00e3627b5981b111362a437a0150eea241500158204e05861d714244c9398f61b1aff80bf4c20d6739bf7cb5f410b58a6c914d207e1b7ffffffffececf17028201d818587cd8799f4040581c659ab0b5658687c2e74cd10dba8244015b713bf503b90557769d77a74a57696e675269646572730000d87980581cdeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeadbeaf4005050a0a19271058204e05861d714244c9398f61b1aff80bf4c20d6739bf7cb5f410b58a6c914d207eff825839009493315cd92eb5d8c4304e67b7e16ae36d61d34502694657811a2c8e337b62cfff6403a06a3acbc34f8c46003c69fe79a3628cefa9c47251821a0174fad1a2581c659ab0b5658687c2e74cd10dba8244015b713bf503b90557769d77a7a14a57696e675269646572731a00e4e1c0581cdeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeaddeadbeafa14001021a00087d6f031a051229b1075820bdaa99eb158414dea0a91d6c727e2268574b23efe6e08ab3b841abe8059a030c0b582072119ff0dd22f5f4775e26f3f4341aa5a070ca4f9c2578392399a20db3fcf09f0dd9010281825820cafecafecafecafecafecafecafecafecafecafecafecafecafecafecafecafe000ed9010281581c9493315cd92eb5d8c4304e67b7e16ae36d61d34502694657811a2c8e12d90102818258202c4c554ab6639565fefe958e39718bcb0f0bae74212fc43b89365a3cf4e14ee200a105a182000082d87c80821a000b54351a0d66e7a7f5d90103a0',
    )
    expect(result.txFee).toEqual(BigNumber(556399))
  })
})
