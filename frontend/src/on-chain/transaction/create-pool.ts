import type {Asset, IFetcher, IWallet, RefTxIn} from '@meshsdk/core'
import {
  burnedShareTokens,
  createUnit,
  getShareAssetName,
  isLovelaceUnit,
  LOVELACE_UNIT,
  type MintRedeemer,
  maxShareTokens,
  type PoolDatum,
  parseUnit,
  poolOil,
  poolRefScriptSizeByNetwork,
  poolRefScriptUtxoByNetwork,
  poolScriptAddressByNetwork,
  poolValidatorHash,
  poolValidityAssetNameHex,
  walletNetworkIdToNetwork,
} from '@wingriders/rapid-dex-common'
import {BigNumber} from 'bignumber.js'
import {poolDatumToMesh} from '@/on-chain/datums'
import {mintRedeemerToMesh} from '@/on-chain/redeemers'
import {initTxBuilder} from '@/on-chain/transaction/init'
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

  const poolValidityUnit = createUnit(
    poolValidatorHash,
    poolValidityAssetNameHex,
  )
  const sharesAssetName = getShareAssetName(seed)
  const poolShareUnit = createUnit(poolValidatorHash, sharesAssetName)
  const [assetA, assetB] = sortAssets(assetX, assetY)

  const [aPolicyId, aAssetName] = parseUnit(assetA.unit)
  const [bPolicyId, bAssetName] = parseUnit(assetB.unit)

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
      ...(isLovelaceUnit(assetA.unit)
        ? []
        : [{unit: LOVELACE_UNIT, quantity: poolOil.toString()}]),
      {unit: poolValidityUnit, quantity: '1'},
      {unit: poolShareUnit, quantity: poolSharesQuantity.toString()},
      {
        ...assetA,
        quantity: new BigNumber(assetA.quantity)
          .plus(isLovelaceUnit(assetA.unit) ? poolOil : 0)
          .toString(),
      },
      assetB,
    ])
    .txOutInlineDatumValue(poolDatumToMesh(poolDatum), 'Mesh')

  const builtTx = await txBuilder.complete()
  const txFee = await getTxFee(builtTx)
  return {builtTx, txFee}
}
