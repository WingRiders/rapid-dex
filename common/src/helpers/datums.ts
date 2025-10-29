import {deserializeDatum, type UTxO} from '@meshsdk/core'
import {z} from 'zod'
import type {PoolDatum} from '../on-chain'

const poolDatumSchema = z
  .object({
    fields: z.tuple([
      z.object({bytes: z.string()}),
      z.object({bytes: z.string()}),
      z.object({bytes: z.string()}),
      z.object({bytes: z.string()}),
      z.object({int: z.bigint()}),
      z.object({int: z.bigint()}),
      z.object({bytes: z.string()}),
    ]),
  })
  .transform(({fields}) => ({
    aPolicyId: fields[0].bytes,
    aAssetName: fields[1].bytes,
    bPolicyId: fields[2].bytes,
    bAssetName: fields[3].bytes,
    swapFeePoints: Number(fields[4].int),
    feeBasis: Number(fields[5].int),
    sharesAssetName: fields[6].bytes,
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
