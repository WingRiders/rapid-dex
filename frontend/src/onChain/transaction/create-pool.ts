import {poolDatumToMesh} from '@/onChain/datums'
import {mintRedeemerToMesh} from '@/onChain/redeemers'
import {initTxBuilder} from '@/onChain/transaction/init'
import type {IFetcher, IWallet, RefTxIn} from '@meshsdk/core'
import {type Asset, parseAssetUnit} from '@meshsdk/core'
import {
  type MintRedeemer,
  type PoolDatum,
  burnedShareTokens,
  getShareAssetName,
  maxShareTokens,
  poolOil,
  poolRefScriptSizeByNetwork,
  poolRefScriptUtxoByNetwork,
  poolScriptAddressByNetwork,
  poolValidatorHash,
  poolValidityAssetNameHex,
  walletNetworkIdToNetwork,
} from '@wingriders/rapid-dex-common'
import {BigNumber} from 'bignumber.js'
import {sortAssets} from '../../helpers/asset'
import {getTxFee} from './fee'

export type BuildCreatePoolTxArgs = {
  wallet: IWallet
  fetcher?: IFetcher
  assetX: Asset
  assetY: Asset
  outShares: BigNumber
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
  assetX,
  assetY,
  outShares,
  seed,
  feeBasis,
  swapFeePoints,
  now = new Date(),
}: BuildCreatePoolTxArgs): Promise<BuildCreatePoolTxResult> => {
  const network = walletNetworkIdToNetwork(await wallet.getNetworkId())
  const {txBuilder} = await initTxBuilder({
    wallet,
    additionalUtxos: [poolRefScriptUtxoByNetwork[network]],
    doNotSpendUtxos: [seed],
    fetcher,
    now,
  })

  const poolValidityUnit = `${poolValidatorHash}${poolValidityAssetNameHex}`
  const sharesAssetName = getShareAssetName(seed)
  const poolShareUnit = `${poolValidatorHash}${sharesAssetName}`
  const [assetA, assetB] = sortAssets(assetX, assetY)

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

  const mintedSharesQuantity = maxShareTokens.minus(burnedShareTokens)
  const poolSharesQuantity = mintedSharesQuantity.minus(outShares)

  const mintRedeemer: MintRedeemer = {seedRef: seed}

  txBuilder
    .txIn(seed.txHash, seed.txIndex)
    .mintPlutusScriptV3()
    .mint('1', poolValidatorHash, poolValidityAssetNameHex)
    .mintTxInReference(
      poolRefScriptUtxoByNetwork[network].input.txHash,
      poolRefScriptUtxoByNetwork[network].input.outputIndex,
      poolRefScriptSizeByNetwork[network].toString(),
      poolValidatorHash,
    )
    .mintRedeemerValue(mintRedeemerToMesh(mintRedeemer), 'Mesh')
    .mintPlutusScriptV3()
    .mint(mintedSharesQuantity.toString(), poolValidatorHash, sharesAssetName)
    .mintTxInReference(
      poolRefScriptUtxoByNetwork[network].input.txHash,
      poolRefScriptUtxoByNetwork[network].input.outputIndex,
      poolRefScriptSizeByNetwork[network].toString(),
      poolValidatorHash,
    )
    .mintRedeemerValue(mintRedeemerToMesh(mintRedeemer), 'Mesh')
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
