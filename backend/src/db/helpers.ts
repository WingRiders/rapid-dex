import type {Asset, UTxO} from '@meshsdk/core'
import type {PoolOutput} from '@prisma/client'
import {
  LOVELACE_UNIT,
  type PoolState,
  bigintToBigNumber,
  createUnit,
  maxShareTokens,
  parseUtxoId,
} from '@wingriders/rapid-dex-common'

export const dbPoolOutputToPoolState = (
  poolOutput: Pick<PoolOutput, 'qtyA' | 'qtyB' | 'lpts'>,
): PoolState => ({
  qtyA: bigintToBigNumber(poolOutput.qtyA),
  qtyB: bigintToBigNumber(poolOutput.qtyB),
  issuedShares: maxShareTokens.minus(bigintToBigNumber(poolOutput.lpts)),
})

export const dbPoolOutputToUtxo = (
  poolOutput: Pick<
    PoolOutput,
    'utxoId' | 'address' | 'assets' | 'coins' | 'datumCBOR'
  >,
): UTxO => ({
  input: parseUtxoId(poolOutput.utxoId),
  output: {
    address: poolOutput.address,
    amount: (poolOutput.assets as Asset[]).concat({
      unit: LOVELACE_UNIT,
      quantity: poolOutput.coins.toString(),
    }),
    plutusData: poolOutput.datumCBOR,
  },
})

export const dbPoolOutputToPool = (
  poolOutput: Pick<
    PoolOutput,
    | 'assetAPolicy'
    | 'assetAName'
    | 'assetBPolicy'
    | 'assetBName'
    | 'shareAssetName'
    | 'swapFeePoints'
    | 'feeBasis'
    | 'lpts'
    | 'qtyA'
    | 'qtyB'
  >,
) => ({
  unitA: createUnit(poolOutput.assetAPolicy, poolOutput.assetAName),
  unitB: createUnit(poolOutput.assetBPolicy, poolOutput.assetBName),
  shareAssetName: poolOutput.shareAssetName,
  poolState: dbPoolOutputToPoolState(poolOutput),
  swapFeePoints: poolOutput.swapFeePoints,
  feeBasis: poolOutput.feeBasis,
})
