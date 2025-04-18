import type {Asset, IFetcher, IWallet, UTxO} from '@meshsdk/core'
import {
  type PoolRedeemer,
  poolRefScriptSizeByNetwork,
  poolRefScriptUtxoByNetwork,
  walletNetworkIdToNetwork,
} from '@wingriders/rapid-dex-common'
import type BigNumber from 'bignumber.js'
import {poolRedeemerToMesh} from '../redeemers'
import {getTxFee} from './fee'
import {initTxBuilder} from './init'

type BuildSpentPoolOutputTxArgs = {
  wallet: IWallet
  fetcher?: IFetcher
  poolUtxo: UTxO
  poolRedeemer: PoolRedeemer
  newPoolAmount: Asset[]
  now?: Date // if not provided, the current date will be used
}

type BuildSpentPoolOutputTxResult = {
  builtTx: string
  txFee: BigNumber
}

export const buildSpentPoolOutputTx = async ({
  wallet,
  fetcher,
  poolUtxo,
  poolRedeemer,
  newPoolAmount,
  now = new Date(),
}: BuildSpentPoolOutputTxArgs): Promise<BuildSpentPoolOutputTxResult> => {
  const network = walletNetworkIdToNetwork(await wallet.getNetworkId())
  const {txBuilder} = await initTxBuilder({
    wallet,
    additionalUtxos: [poolRefScriptUtxoByNetwork[network], poolUtxo],
    fetcher,
    now,
  })

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
    .txInRedeemerValue(poolRedeemerToMesh(poolRedeemer), 'Mesh')
    .txOut(poolUtxo.output.address, newPoolAmount)
    .txOutInlineDatumValue(poolUtxo.output.plutusData!, 'CBOR')

  const builtTx = await txBuilder.complete()
  const txFee = await getTxFee(builtTx)
  return {builtTx, txFee}
}
