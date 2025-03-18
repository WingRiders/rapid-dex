import {MeshValue} from '@meshsdk/core'
import type {Asset, UTxO} from '@meshsdk/core'
import {
  type SupportedNetwork,
  bigintToBigNumber,
  poolDatumFromCbor,
  poolOil,
  poolScriptAddressByNetwork,
  poolValidatorHash,
} from '@wingriders/rapid-dex-common'
import {BigNumber} from 'bignumber.js'

type PoolUnits = {
  aTokenUnit: string
  bTokenUnit: string
  shareUnit: string
}

// Corresponds to PoolOutput prisma model
// Can be replaced with tRPC type once client is implemented
export type PoolState = {
  utxoId: string
  poolUnits: PoolUnits
  assets: Asset[]
  qtyA: BigNumber
  qtyB: BigNumber
  qtyShares: BigNumber
  coins: BigNumber
  datumCbor: string
  swapFeePoints: number
  feeBasis: number
}

export const poolStateToUtxo = (
  network: SupportedNetwork,
  poolState: PoolState,
): UTxO => {
  const [txHash, outputIndex] = poolState.utxoId.split('#')
  if (!txHash || !outputIndex) {
    throw new Error(`Invalid utxoId: ${poolState.utxoId}`)
  }

  return {
    input: {txHash, outputIndex: Number(outputIndex)},
    output: {
      address: poolScriptAddressByNetwork[network],
      amount: poolState.assets,
      plutusData: poolState.datumCbor,
    },
  }
}

export const utxoToPoolState = (utxo: UTxO): PoolState => {
  const datumCbor = utxo.output.plutusData!
  const poolDatum = poolDatumFromCbor(datumCbor)
  const aTokenUnit =
    `${poolDatum.aPolicyId}${poolDatum.aAssetName}` || 'lovelace'
  const bTokenUnit = `${poolDatum.bPolicyId}${poolDatum.bAssetName}`
  const shareUnit = `${poolValidatorHash}${poolDatum.sharesAssetName}`
  const assets = utxo.output.amount
  const poolValue = MeshValue.fromAssets(assets)
  const qtyA = bigintToBigNumber(poolValue.get(aTokenUnit)).minus(
    aTokenUnit === 'lovelace' ? poolOil : 0,
  )
  const qtyB = bigintToBigNumber(poolValue.get(bTokenUnit))
  const qtyShares = bigintToBigNumber(poolValue.get(shareUnit))
  return {
    utxoId: `${utxo.input.txHash}#${utxo.input.outputIndex}`,
    poolUnits: {
      aTokenUnit,
      bTokenUnit,
      shareUnit,
    },
    assets,
    qtyA,
    qtyB,
    qtyShares,
    coins: bigintToBigNumber(poolValue.get('lovelace')),
    datumCbor,
    swapFeePoints: poolDatum.swapFeePoints,
    feeBasis: poolDatum.feeBasis,
  }
}

type GetNewPoolAmountArgs = {
  poolState: PoolState
  lockA: BigNumber
  lockB: BigNumber
  lockShares?: BigNumber
}

export const getNewPoolAmount = ({
  poolState,
  lockA,
  lockB,
  lockShares = new BigNumber(0),
}: GetNewPoolAmountArgs) => {
  const meshValue = MeshValue.fromAssets(poolState.assets)
  meshValue.addAssets([
    {
      unit: poolState.poolUnits.aTokenUnit,
      quantity: lockA.toString(),
    },
    {
      unit: poolState.poolUnits.bTokenUnit,
      quantity: lockB.toString(),
    },
    {
      unit: poolState.poolUnits.shareUnit,
      quantity: lockShares.toString(),
    },
  ])
  return meshValue.toAssets()
}
