import {calculatePoolAmountAfterAddLiquidity} from '@/amm/addLiquidity'
import type {IFetcher, IWallet} from '@meshsdk/common'
import type {UTxO} from '@meshsdk/core'
import {
  type AddLiquidityRedeemer,
  type PoolDatum,
  poolDatumFromPoolUtxo,
} from '@wingriders/rapid-dex-common'
import type BigNumber from 'bignumber.js'
import {buildSpentPoolOutputTx} from './buildSpentPoolOutputTx'

type BuildAddLiquidityTxArgs = {
  wallet: IWallet
  fetcher?: IFetcher
  poolUtxo: UTxO
  lockA: BigNumber
  lockB: BigNumber
  now?: Date // if not provided, the current date will be used
}

export const buildAddLiquidityTx = async ({
  wallet,
  fetcher,
  poolUtxo,
  lockA,
  lockB,
  now = new Date(),
}: BuildAddLiquidityTxArgs) => {
  const poolDatum: PoolDatum = poolDatumFromPoolUtxo(poolUtxo)
  const poolAmount = poolUtxo.output.amount
  const {newPoolAmount} = calculatePoolAmountAfterAddLiquidity(
    poolDatum,
    poolAmount,
    lockA,
    lockB,
  )
  const addLiquidityRedeemer: AddLiquidityRedeemer = {
    aAdd: lockA.toNumber(),
    bAdd: lockB.toNumber(),
  }

  return buildSpentPoolOutputTx({
    wallet,
    fetcher,
    poolUtxo,
    poolDatum,
    poolRedeemer: addLiquidityRedeemer,
    newPoolAmount,
    now,
  })
}
