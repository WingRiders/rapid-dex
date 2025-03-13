import type {Asset, IFetcher, IWallet} from '@meshsdk/core'
import {
  type PoolRedeemer,
  poolRefScriptSizeByNetwork,
  poolRefScriptUtxoByNetwork,
  poolScriptAddressByNetwork,
  walletNetworkIdToNetwork,
} from '@wingriders/rapid-dex-common'
import type BigNumber from 'bignumber.js'
import {poolRedeemerToMesh} from '../redeemers'
import {getTxFee} from './fee'
import {initTxBuilder} from './init'
import {type PoolState, poolStateToUtxo} from './pool-state'

type BuildSpentPoolOutputTxArgs = {
  wallet: IWallet
  fetcher?: IFetcher
  poolState: PoolState
  poolRedeemer: PoolRedeemer
  newPoolAmount: Asset[]
  now?: Date // if not provided, the current date will be used
}

export type BuildAddLiquidityTxResult = {
  builtTx: string
  txFee: BigNumber
}

export const buildSpentPoolOutputTx = async ({
  wallet,
  fetcher,
  poolState,
  poolRedeemer,
  newPoolAmount,
  now = new Date(),
}: BuildSpentPoolOutputTxArgs): Promise<BuildAddLiquidityTxResult> => {
  const network = walletNetworkIdToNetwork(await wallet.getNetworkId())
  const poolUtxo = poolStateToUtxo(network, poolState)
  const {txBuilder} = await initTxBuilder({
    wallet,
    additionalUtxos: [poolRefScriptUtxoByNetwork[network], poolUtxo],
    fetcher,
    now,
  })

  const [txHash, outputIndex] = poolState.utxoId.split('#')

  txBuilder
    .spendingPlutusScriptV3()
    .txIn(
      txHash,
      Number(outputIndex),
      poolState.assets,
      poolScriptAddressByNetwork[network],
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
    .txOut(poolScriptAddressByNetwork[network], newPoolAmount)
    .txOutInlineDatumValue(poolState.datumCbor, 'CBOR')

  const builtTx = await txBuilder.complete()
  const txFee = await getTxFee(builtTx)
  return {builtTx, txFee}
}
