import type {IFetcher, IWallet} from '@meshsdk/core'
import type {SwapRedeemer} from '@wingriders/rapid-dex-common'
import type BigNumber from 'bignumber.js'
import {getNewPoolAmount} from './pool-state'
import {buildSpentPoolOutputTx} from './spent-pool-output'
import type {PoolInteractionTxPool} from './types'

export type BuildSwapTxArgs = {
  wallet: IWallet
  fetcher?: IFetcher
  pool: PoolInteractionTxPool
  aToB: boolean
  lockX: BigNumber
  outY: BigNumber
  now?: Date // if not provided, the current date will be used
}

type BuildSwapTxResult = {
  builtTx: string
  txFee: BigNumber
}

/**
 * Builds a transaction for swapping tokens in a liquidity pool.
 */
export const buildSwapTx = async ({
  wallet,
  fetcher,
  pool,
  aToB,
  lockX,
  outY,
  now = new Date(),
}: BuildSwapTxArgs): Promise<BuildSwapTxResult> => {
  const swapRedeemer: SwapRedeemer = {
    swapAToB: aToB,
    provided: lockX.toNumber(),
  }

  return buildSpentPoolOutputTx({
    wallet,
    fetcher,
    poolUtxo: pool.utxo,
    poolRedeemer: swapRedeemer,
    newPoolAmount: getNewPoolAmount({
      pool,
      lockA: aToB ? lockX : outY.negated(),
      lockB: aToB ? outY.negated() : lockX,
    }),
    now,
  })
}
