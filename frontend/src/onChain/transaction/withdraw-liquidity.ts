import {
  type PoolState,
  getNewPoolAmount,
} from '@/onChain/transaction/pool-state'
import type {IFetcher, IWallet} from '@meshsdk/common'
import type {WithdrawLiquidityRedeemer} from '@wingriders/rapid-dex-common'
import type BigNumber from 'bignumber.js'
import {buildSpentPoolOutputTx} from './spent-pool-output'

type BuildWithdrawLiquidityTxArgs = {
  wallet: IWallet
  fetcher?: IFetcher
  poolState: PoolState
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
  poolState,
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
    poolState,
    poolRedeemer: withdrawLiquidityRedeemer,
    newPoolAmount: getNewPoolAmount({
      poolState,
      lockA: outA.negated(),
      lockB: outB.negated(),
      lockShares,
    }),
    now,
  })
}
