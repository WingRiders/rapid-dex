import {type PoolState, getNewPoolAmount} from '@/onChain/transaction/poolState'
import type {IFetcher, IWallet} from '@meshsdk/common'
import type {SwapRedeemer} from '@wingriders/rapid-dex-common'
import type BigNumber from 'bignumber.js'
import {buildSpentPoolOutputTx} from './buildSpentPoolOutputTx'

type BuildSwapTxArgs = {
  wallet: IWallet
  fetcher?: IFetcher
  poolState: PoolState
  aToB: boolean
  lockX: BigNumber
  outY: BigNumber
  now?: Date // if not provided, the current date will be used
}

type BuildSwapTxResult = {
  builtTx: string
  txFee: BigNumber
}

export const buildSwapTx = async ({
  wallet,
  fetcher,
  poolState,
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
    poolState,
    poolRedeemer: swapRedeemer,
    newPoolAmount: getNewPoolAmount({
      poolState,
      lockA: aToB ? lockX : outY.negated(),
      lockB: aToB ? outY.negated() : lockX,
    }),
    now,
  })
}
