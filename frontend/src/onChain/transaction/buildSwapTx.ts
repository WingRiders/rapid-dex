import {calculatePoolAmountAfterSwap} from '@/amm/swap'
import {poolDatumToMesh} from '@/onChain/datums'
import {poolRedeemerToMesh} from '@/onChain/redeemers'
import type {IFetcher, IWallet} from '@meshsdk/common'
import type {UTxO} from '@meshsdk/core'
import {
  type PoolDatum,
  type SupportedNetwork,
  type SwapRedeemer,
  poolDatumFromPoolUtxo,
  poolRefScriptSizeByNetwork,
  poolRefScriptUtxoByNetwork,
} from '@wingriders/rapid-dex-common'
import type BigNumber from 'bignumber.js'
import {getTxFee} from './fee'
import {initTxBuilder} from './initTxBuilder'

type BuildSwapTxArgs = {
  network: SupportedNetwork
  wallet: IWallet
  fetcher?: IFetcher
  poolUtxo: UTxO
  aToB: boolean
  lockX: BigNumber
  now?: Date // if not provided, the current date will be used
}

type BuildSwapTxResult = {
  builtTx: string
  txFee: BigNumber
}

export const buildSwapTx = async ({
  network,
  wallet,
  fetcher,
  poolUtxo,
  aToB,
  lockX,
  now = new Date(),
}: BuildSwapTxArgs): Promise<BuildSwapTxResult> => {
  const {txBuilder} = await initTxBuilder({
    network,
    wallet,
    additionalUtxos: [poolRefScriptUtxoByNetwork[network], poolUtxo],
    fetcher,
    now,
  })

  const poolDatum: PoolDatum = poolDatumFromPoolUtxo(poolUtxo)
  const poolAmount = poolUtxo.output.amount

  const {newPoolAmount} = calculatePoolAmountAfterSwap(
    poolDatum,
    poolAmount,
    aToB,
    lockX,
  )

  const swapRedeemer: SwapRedeemer = {
    swapAToB: aToB,
    provided: lockX.toNumber(),
  }

  txBuilder
    .spendingPlutusScriptV3()
    .txIn(
      poolUtxo.input.txHash,
      poolUtxo.input.outputIndex,
      poolUtxo.output.amount,
      poolUtxo.output.address,
      poolRefScriptSizeByNetwork[network],
    )
    .spendingTxInReference(
      poolRefScriptUtxoByNetwork[network].input.txHash,
      poolRefScriptUtxoByNetwork[network].input.outputIndex,
      poolRefScriptSizeByNetwork[network].toString(),
      poolRefScriptUtxoByNetwork[network].output.scriptHash,
    )
    .txInInlineDatumPresent()
    .txInRedeemerValue(poolRedeemerToMesh(swapRedeemer), 'Mesh')
    .txOut(poolUtxo.output.address, newPoolAmount)
    .txOutInlineDatumValue(poolDatumToMesh(poolDatum), 'Mesh')

  const builtTx = await txBuilder.complete()
  const txFee = await getTxFee(builtTx)
  return {builtTx, txFee}
}
