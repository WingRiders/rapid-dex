import type {IFetcher, IWallet} from '@meshsdk/common'
import type {AddLiquidityRedeemer} from '@wingriders/rapid-dex-common'
import type BigNumber from 'bignumber.js'
import {buildSpentPoolOutputTx} from './buildSpentPoolOutputTx'
import {type PoolState, getNewPoolAmount} from './poolState'

type BuildAddLiquidityTxArgs = {
  wallet: IWallet
  fetcher?: IFetcher
  poolState: PoolState
  lockA: BigNumber
  lockB: BigNumber
  earnedShares: BigNumber
  now?: Date // if not provided, the current date will be used
}

export const buildAddLiquidityTx = async ({
  wallet,
  fetcher,
  poolState,
  lockA,
  lockB,
  earnedShares,
  now = new Date(),
}: BuildAddLiquidityTxArgs) => {
  const addLiquidityRedeemer: AddLiquidityRedeemer = {
    aAdd: lockA.toNumber(),
    bAdd: lockB.toNumber(),
  }
  return buildSpentPoolOutputTx({
    wallet,
    fetcher,
    poolState,
    poolRedeemer: addLiquidityRedeemer,
    newPoolAmount: getNewPoolAmount({
      poolState,
      lockA,
      lockB,
      lockShares: earnedShares.negated(),
    }),
    now,
  })
}
