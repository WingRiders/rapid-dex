import {deserializeDatum, type UTxO} from '@meshsdk/core'
import {z} from 'zod'
import {FeeFrom, type PoolDatum} from '../on-chain'

const feeFromSchema = z
  .object({
    // We expect Plutus constructor to always be bigint.
    // If a decoding library ever returns number instead, tests will fail.
    constructor: z.bigint(),
    fields: z.tuple([]),
  })
  .transform(({constructor: ctor}) => {
    switch (ctor) {
      case 0n:
        return FeeFrom.InputToken
      case 1n:
        return FeeFrom.OutputToken
      case 2n:
        return FeeFrom.TokenA
      case 3n:
        return FeeFrom.TokenB
      default:
        throw new Error(`Invalid FeeFrom constructor: ${ctor}`)
    }
  })

const poolDatumSchema = z
  .object({
    fields: z.tuple([
      z.object({bytes: z.string()}), // aPolicyId
      z.object({bytes: z.string()}), // aAssetName
      z.object({bytes: z.string()}), // bPolicyId
      z.object({bytes: z.string()}), // bAssetName
      feeFromSchema, // feeFrom
      z.object({int: z.bigint()}), // swapFeePointsAToB
      z.object({int: z.bigint()}), // swapFeePointsBToA
      z.object({int: z.bigint()}), // feeBasis
      z.object({bytes: z.string()}), // sharesAssetName
    ]),
  })
  .transform(({fields}) => ({
    aPolicyId: fields[0].bytes,
    aAssetName: fields[1].bytes,
    bPolicyId: fields[2].bytes,
    bAssetName: fields[3].bytes,
    feeFrom: fields[4],
    swapFeePointsAToB: Number(fields[5].int),
    swapFeePointsBToA: Number(fields[6].int),
    feeBasis: Number(fields[7].int),
    sharesAssetName: fields[8].bytes,
  }))

export const poolDatumCborFromPoolUtxo = (poolUtxo: UTxO): string => {
  if (!poolUtxo.output.plutusData) {
    throw new Error(
      `No inline datum in pool UTxO ${poolUtxo.input.txHash}#${poolUtxo.input.outputIndex}`,
    )
  }
  return poolUtxo.output.plutusData
}

export const poolDatumFromPoolUtxo = (poolUtxo: UTxO) =>
  poolDatumFromCbor(poolDatumCborFromPoolUtxo(poolUtxo))

export const poolDatumFromCbor = (plutusData: string): PoolDatum => {
  const datum = deserializeDatum(plutusData)
  return poolDatumSchema.parse(datum)
}
