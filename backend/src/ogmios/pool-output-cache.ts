import {prisma} from '../db/prisma-client'

type PoolOutputCacheEntry = {
  shareAssetName: string
  qtyA: bigint
  qtyB: bigint
  treasuryA: bigint
  treasuryB: bigint
  lpts: bigint
}

let poolOutputCache = new Map<string, PoolOutputCacheEntry>()

export const initPoolOutputCache = async () => {
  const utxos = await prisma.poolOutput.findMany({
    where: {spendUtxoId: null},
    select: {
      utxoId: true,
      shareAssetName: true,
      qtyA: true,
      qtyB: true,
      treasuryA: true,
      treasuryB: true,
      lpts: true,
    },
  })
  poolOutputCache = new Map(
    utxos.map(
      ({utxoId, shareAssetName, qtyA, qtyB, treasuryA, treasuryB, lpts}) => [
        utxoId,
        {shareAssetName, qtyA, qtyB, treasuryA, treasuryB, lpts},
      ],
    ),
  )
}

export const addPoolOutputToCache = (
  utxoId: string,
  entry: PoolOutputCacheEntry,
) => poolOutputCache.set(utxoId, entry)

export const removePoolOutputFromCache = (utxoId: string) =>
  poolOutputCache.delete(utxoId)

export const poolOutputExists = (utxoId: string) => poolOutputCache.has(utxoId)

export const getPoolOutputCacheEntry = (utxoId: string) =>
  poolOutputCache.get(utxoId)
