import type {IFetcher, IWallet, UTxO} from '@meshsdk/core'
import type {WithdrawTreasuryRedeemer} from '@wingriders/rapid-dex-common'
import type BigNumber from 'bignumber.js'
import {getNewPoolAmount} from './pool-state'
import {buildSpentPoolOutputTx} from './spent-pool-output'
import type {PoolInteractionTxPool} from './types'

export type BuildWithdrawTreasuryTxArgs = {
  wallet: IWallet
  fetcher?: IFetcher
  pool: PoolInteractionTxPool
  treasuryAuthorityUtxo: UTxO
  now?: Date // if not provided, the current date will be used
}

type BuildWithdrawTreasuryTxResult = {
  builtTx: string
  txFee: BigNumber
}

/**
 * Builds a transaction for withdrawing treasury from a pool.
 */
export const buildWithdrawTreasuryTx = async ({
  wallet,
  fetcher,
  pool,
  treasuryAuthorityUtxo,
  now = new Date(),
}: BuildWithdrawTreasuryTxArgs): Promise<BuildWithdrawTreasuryTxResult> => {
  const withdrawLiquidityRedeemer: WithdrawTreasuryRedeemer = {}
  const treasuryA = pool.poolState.treasuryA
  const treasuryB = pool.poolState.treasuryB
  return buildSpentPoolOutputTx({
    wallet,
    fetcher,
    poolUtxo: pool.utxo,
    poolRedeemer: withdrawLiquidityRedeemer,
    newPoolAmount: getNewPoolAmount({
      pool,
      lockA: treasuryA.negated(),
      lockB: treasuryB.negated(),
    }),
    addToTreasuryA: treasuryA.negated(),
    addToTreasuryB: treasuryB.negated(),
    now,
    additionalInputsUtxos: [treasuryAuthorityUtxo],
  })
}
