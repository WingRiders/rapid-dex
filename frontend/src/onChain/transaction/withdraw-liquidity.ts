import {getNewPoolAmount} from '@/onChain/transaction/pool-state'
import type {IFetcher, IWallet} from '@meshsdk/core'
import type {WithdrawLiquidityRedeemer} from '@wingriders/rapid-dex-common'
import type BigNumber from 'bignumber.js'
import {buildSpentPoolOutputTx} from './spent-pool-output'
import type {PoolInteractionTxPool} from './types'

type BuildWithdrawLiquidityTxArgs = {
  wallet: IWallet
  fetcher?: IFetcher
  pool: PoolInteractionTxPool
  lockShares: BigNumber
  outA: BigNumber
  outB: BigNumber
  now?: Date // if not provided, the current date will be used
}

type BuildWithdrawLiquidityTxResult = {
  builtTx: string
  txFee: BigNumber
}

export const buildWithdrawLiquidityTx = async ({
  wallet,
  fetcher,
  pool,
  lockShares,
  outA,
  outB,
  now = new Date(),
}: BuildWithdrawLiquidityTxArgs): Promise<BuildWithdrawLiquidityTxResult> => {
  const withdrawLiquidityRedeemer: WithdrawLiquidityRedeemer = {
    sharesAdd: lockShares.toNumber(),
  }
  return buildSpentPoolOutputTx({
    wallet,
    fetcher,
    poolUtxo: pool.utxo,
    poolRedeemer: withdrawLiquidityRedeemer,
    newPoolAmount: getNewPoolAmount({
      pool,
      lockA: outA.negated(),
      lockB: outB.negated(),
      lockShares,
    }),
    now,
  })
}
