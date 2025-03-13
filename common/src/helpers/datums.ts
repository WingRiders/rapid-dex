import {type UTxO, deserializeDatum} from '@meshsdk/core'
import {z} from 'zod'
import type {PoolDatum} from '../onChain'

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

export const poolDatumFromPoolUtxo = (poolUtxo: UTxO) => {
  if (!poolUtxo.output.plutusData) {
    throw new Error(
      `No inline datum in pool UTxO ${poolUtxo.input.txHash}#${poolUtxo.input.outputIndex}`,
    )
  }
  return poolDatumFromCbor(poolUtxo.output.plutusData)
}

export const poolDatumFromCbor = (plutusData: string): PoolDatum => {
  const datum = deserializeDatum(plutusData)
  return poolDatumSchema.parse(datum)
}
