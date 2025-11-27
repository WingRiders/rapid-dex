import type {Asset, UTxO} from '@meshsdk/core'
import {FeeFrom as DbFeeFrom, type PoolOutput} from '@prisma/client'
import {
  bigintToBigNumber,
  createUnit,
  FeeFrom,
  LOVELACE_UNIT,
  maxShareTokens,
  type PoolState,
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
    | 'feeFrom'
    | 'swapFeePointsAToB'
    | 'swapFeePointsBToA'
    | 'treasuryFeePointsAToB'
    | 'treasuryFeePointsBToA'
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
  feeFrom: dbFeeFromToFeeFrom(poolOutput.feeFrom),
  swapFeePointsAToB: poolOutput.swapFeePointsAToB,
  swapFeePointsBToA: poolOutput.swapFeePointsBToA,
  treasuryFeePointsAToB: poolOutput.treasuryFeePointsAToB,
  treasuryFeePointsBToA: poolOutput.treasuryFeePointsBToA,
  feeBasis: poolOutput.feeBasis,
})

const dbFeeFromToFeeFrom = (dbFeeFrom: DbFeeFrom): FeeFrom =>
  ({
    [DbFeeFrom.InputToken]: FeeFrom.InputToken,
    [DbFeeFrom.OutputToken]: FeeFrom.OutputToken,
    [DbFeeFrom.TokenA]: FeeFrom.TokenA,
    [DbFeeFrom.TokenB]: FeeFrom.TokenB,
  })[dbFeeFrom]

export const feeFromToDbFeeFrom = (feeFrom: FeeFrom): DbFeeFrom =>
  ({
    [FeeFrom.InputToken]: DbFeeFrom.InputToken,
    [FeeFrom.OutputToken]: DbFeeFrom.OutputToken,
    [FeeFrom.TokenA]: DbFeeFrom.TokenA,
    [FeeFrom.TokenB]: DbFeeFrom.TokenB,
  })[feeFrom]
