import {calculatePoolAmountAfterSwap} from '@/amm/swap'
import {isCollateralUtxo} from '@/onChain/collateral'
import {poolDatumToMesh} from '@/onChain/datums'
import {poolRedeemerToMesh} from '@/onChain/redeemers'
import type {IFetcher, IWallet} from '@meshsdk/common'
import {
  MeshTxBuilder,
  OfflineFetcher,
  type UTxO,
  deserializeAddress,
  resolveSlotNo,
} from '@meshsdk/core'
import {
  type PoolDatum,
  type SwapRedeemer,
  poolDatumFromPoolUtxo,
  poolRefScriptSizeByNetwork,
  poolRefScriptUtxoByNetwork,
  walletNetworkIdToNetwork,
} from '@wingriders/rapid-dex-common'
import type BigNumber from 'bignumber.js'
import {addMinutes} from 'date-fns'
import {getTxFee} from './fee'

const VALIDITY_END_OFFSET_MINUTES = 30

type BuildSwapTxArgs = {
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
  wallet,
  fetcher,
  poolUtxo,
  aToB,
  lockX,
  now = new Date(),
}: BuildSwapTxArgs): Promise<BuildSwapTxResult> => {
  const utxos = await wallet.getUtxos()
  const collateralUtxo = utxos.find(isCollateralUtxo)
  if (!collateralUtxo) {
    throw new Error('No collateral UTxO found')
  }

  const changeAddress = await wallet.getChangeAddress()
  const network = walletNetworkIdToNetwork(await wallet.getNetworkId())
  const txValidityEndTime = addMinutes(
    now,
    VALIDITY_END_OFFSET_MINUTES,
  ).getTime()

  const txValidityEndSlot = Number.parseInt(
    resolveSlotNo(network, txValidityEndTime),
    10,
  )
  const {pubKeyHash: authorityKeyHex} = deserializeAddress(changeAddress)

  if (fetcher == null) {
    const offlineFetcher = new OfflineFetcher()
    offlineFetcher.addUTxOs(utxos)
    offlineFetcher.addUTxOs([poolRefScriptUtxoByNetwork[network], poolUtxo])
    fetcher = offlineFetcher
  }
  const coreCsl = await import('@meshsdk/core-csl')
  const evaluator = new coreCsl.OfflineEvaluator(fetcher, network)

  const txBuilder = new MeshTxBuilder({
    evaluator: {
      evaluateTx: (tx) => evaluator.evaluateTx(tx, [], []),
    },
    fetcher,
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
    .setNetwork(network)
    .selectUtxosFrom(utxos)
    .changeAddress(changeAddress)
    .requiredSignerHash(authorityKeyHex)
    .invalidHereafter(txValidityEndSlot)
    .txInCollateral(
      collateralUtxo.input.txHash,
      collateralUtxo.input.outputIndex,
      collateralUtxo.output.amount,
      collateralUtxo.output.address,
    )
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
