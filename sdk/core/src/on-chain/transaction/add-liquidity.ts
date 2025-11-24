import type {IFetcher, IWallet} from '@meshsdk/core'
import type {AddLiquidityRedeemer} from '@wingriders/rapid-dex-common'
import type BigNumber from 'bignumber.js'
import {getNewPoolAmount} from './pool-state'
import {buildSpentPoolOutputTx} from './spent-pool-output'
import type {PoolInteractionTxPool} from './types'

export type BuildAddLiquidityTxArgs = {
  wallet: IWallet
  fetcher?: IFetcher
  pool: PoolInteractionTxPool
  lockA: BigNumber
  lockB: BigNumber
  earnedShares: BigNumber
  now?: Date // if not provided, the current date will be used
}

/**
 * Builds a transaction for adding liquidity to a pool.
 */
export const buildAddLiquidityTx = async ({
  wallet,
  fetcher,
  pool,
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
    poolUtxo: pool.utxo,
    poolRedeemer: addLiquidityRedeemer,
    newPoolAmount: getNewPoolAmount({
      pool,
      lockA,
      lockB,
      lockShares: earnedShares.negated(),
    }),
    now,
  })
}
