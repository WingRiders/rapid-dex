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
  xSwap: BigNumber
  addToTreasuryA: BigNumber
  addToTreasuryB: BigNumber
  now?: Date // if not provided, the current date will be used
}

/**
 * Builds a transaction for adding liquidity to a pool.
 * If lockA === 0 || lockB === 0, it's a Zap-In and xSwap should be > 0.
 */
export const buildAddLiquidityTx = async ({
  wallet,
  fetcher,
  pool,
  lockA,
  lockB,
  earnedShares,
  xSwap,
  addToTreasuryA,
  addToTreasuryB,
  now = new Date(),
}: BuildAddLiquidityTxArgs) => {
  const addLiquidityRedeemer: AddLiquidityRedeemer = {
    aAdd: lockA.toNumber(),
    bAdd: lockB.toNumber(),
    xSwap: xSwap.toNumber(),
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
    addToTreasuryA,
    addToTreasuryB,
    now,
  })
}
