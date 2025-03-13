import {calculateSharesCreatePool} from '@/amm/createPool'
import {isCollateralUtxo} from '@/onChain/collateral'
import {poolDatumToMesh} from '@/onChain/datums'
import {calculateTtl} from '@/onChain/transaction/ttl'
import type {IFetcher, IWallet, RefTxIn} from '@meshsdk/common'
import {
  type Asset,
  MeshTxBuilder,
  OfflineFetcher,
  deserializeAddress,
  parseAssetUnit,
} from '@meshsdk/core'
import {
  type PoolDatum,
  getShareAssetName,
  poolOil,
  poolRefScriptSizeByNetwork,
  poolRefScriptUtxoByNetwork,
  poolScriptAddressByNetwork,
  poolValidatorHash,
  poolValidityAssetNameHex,
  walletNetworkIdToNetwork,
} from '@wingriders/rapid-dex-common'
import {BigNumber} from 'bignumber.js'
import {getTxFee} from './fee'

type BuildCreatePoolTxArgs = {
  wallet: IWallet
  fetcher?: IFetcher
  assetA: Asset
  assetB: Asset
  seed: RefTxIn
  feeBasis: number
  swapFeePoints: number
  now?: Date // if not provided, the current date will be used
}

export type BuildCreatePoolTxResult = {
  builtTx: string
  txFee: BigNumber
}

export const buildCreatePoolTx = async ({
  wallet,
  fetcher,
  assetA,
  assetB,
  seed,
  feeBasis,
  swapFeePoints,
  now = new Date(),
}: BuildCreatePoolTxArgs): Promise<BuildCreatePoolTxResult> => {
  const utxos = await wallet.getUtxos()
  const collateralUtxo = utxos.find(isCollateralUtxo)
  if (!collateralUtxo) {
    throw new Error('No collateral UTxO found')
  }

  const changeAddress = await wallet.getChangeAddress()
  const network = walletNetworkIdToNetwork(await wallet.getNetworkId())

  const {pubKeyHash: authorityKeyHex} = deserializeAddress(changeAddress)

  if (fetcher == null) {
    const offlineFetcher = new OfflineFetcher()
    offlineFetcher.addUTxOs(utxos)
    offlineFetcher.addUTxOs([poolRefScriptUtxoByNetwork[network]])
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

  const poolValidityUnit = `${poolValidatorHash}${poolValidityAssetNameHex}`
  const sharesAssetName = getShareAssetName(seed)
  const poolShareUnit = `${poolValidatorHash}${sharesAssetName}`
  const {minted: mintedSharesQuantity, pool: poolSharesQuantity} =
    calculateSharesCreatePool(assetA.quantity, assetB.quantity)

  const {policyId: aPolicyId, assetName: aAssetName} = parseAssetUnit(
    assetA.unit === 'lovelace' ? '' : assetA.unit,
  )
  const {policyId: bPolicyId, assetName: bAssetName} = parseAssetUnit(
    assetB.unit,
  )

  const poolDatum: PoolDatum = {
    aAssetName,
    aPolicyId,
    bAssetName,
    bPolicyId,
    feeBasis,
    sharesAssetName,
    swapFeePoints,
  }

  txBuilder
    .setNetwork(network)
    .selectUtxosFrom(utxos)
    .changeAddress(changeAddress)
    .requiredSignerHash(authorityKeyHex)
    .invalidHereafter(calculateTtl(now, network))
    .txIn(seed.txHash, seed.txIndex)
    .txInCollateral(
      collateralUtxo.input.txHash,
      collateralUtxo.input.outputIndex,
      collateralUtxo.output.amount,
      collateralUtxo.output.address,
    )
    .mintPlutusScriptV3()
    .mint('1', poolValidatorHash, poolValidityAssetNameHex)
    .mintTxInReference(
      poolRefScriptUtxoByNetwork[network].input.txHash,
      poolRefScriptUtxoByNetwork[network].input.outputIndex,
      poolRefScriptSizeByNetwork[network].toString(),
      poolValidatorHash,
    )
    .mintRedeemerValue([])
    .mintPlutusScriptV3()
    .mint(mintedSharesQuantity.toString(), poolValidatorHash, sharesAssetName)
    .mintTxInReference(
      poolRefScriptUtxoByNetwork[network].input.txHash,
      poolRefScriptUtxoByNetwork[network].input.outputIndex,
      poolRefScriptSizeByNetwork[network].toString(),
      poolValidatorHash,
    )
    .mintRedeemerValue([])
    .txOut(poolScriptAddressByNetwork[network], [
      ...(assetA.unit === 'lovelace'
        ? []
        : [{unit: 'lovelace', quantity: poolOil.toString()}]),
      {unit: poolValidityUnit, quantity: '1'},
      {unit: poolShareUnit, quantity: poolSharesQuantity.toString()},
      {
        ...assetA,
        quantity: new BigNumber(assetA.quantity)
          .plus(assetA.unit === 'lovelace' ? poolOil : 0)
          .toString(),
      },
      assetB,
    ])
    .txOutInlineDatumValue(poolDatumToMesh(poolDatum), 'Mesh')

  const builtTx = await txBuilder.complete()
  const txFee = await getTxFee(builtTx)
  return {builtTx, txFee}
}
