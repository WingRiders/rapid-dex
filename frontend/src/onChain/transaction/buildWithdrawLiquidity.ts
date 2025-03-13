import {calculatePoolAmountAfterWithdrawLiquidity} from '@/amm/withdrawLiquidity'
import type {IFetcher, IWallet} from '@meshsdk/common'
import type {UTxO} from '@meshsdk/core'
import {
  type PoolDatum,
  type WithdrawLiquidityRedeemer,
  poolDatumFromPoolUtxo,
} from '@wingriders/rapid-dex-common'
import type BigNumber from 'bignumber.js'
import {buildSpentPoolOutputTx} from './buildSpentPoolOutputTx'

type BuildWithdrawLiquidityTxArgs = {
  wallet: IWallet
  fetcher?: IFetcher
  poolUtxo: UTxO
  lockShares: BigNumber
  now?: Date // if not provided, the current date will be used
}

type BuildWithdrawLiquidityTxResult = {
  builtTx: string
  txFee: BigNumber
}

export const buildWithdrawLiquidityTx = async ({
  wallet,
  fetcher,
  poolUtxo,
  lockShares,
  now = new Date(),
}: BuildWithdrawLiquidityTxArgs): Promise<BuildWithdrawLiquidityTxResult> => {
  const poolDatum: PoolDatum = poolDatumFromPoolUtxo(poolUtxo)
  const poolAmount = poolUtxo.output.amount
  const {newPoolAmount} = calculatePoolAmountAfterWithdrawLiquidity(
    poolDatum,
    poolAmount,
    lockShares,
  )
  const withdrawLiquidityRedeemer: WithdrawLiquidityRedeemer = {
    sharesAdd: lockShares.toNumber(),
  }

  return buildSpentPoolOutputTx({
    wallet,
    fetcher,
    poolUtxo,
    poolDatum,
    poolRedeemer: withdrawLiquidityRedeemer,
    newPoolAmount,
    now,
  })
}
