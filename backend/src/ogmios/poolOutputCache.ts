import {prisma} from '../db/prismaClient'

let poolOutputCache: Map<string, {shareAssetName: string}> = new Map()

export const initPoolOutputCache = async () => {
  const utxos = await prisma.poolOutput.findMany({
    where: {spendUtxoId: null},
    select: {utxoId: true, shareAssetName: true},
  })
  poolOutputCache = new Map(
    utxos.map(({utxoId, shareAssetName}) => [utxoId, {shareAssetName}]),
  )
}

export const addPoolOutputToCache = (utxoId: string, shareAssetName: string) =>
  poolOutputCache.set(utxoId, {shareAssetName})

export const removePoolOutputFromCache = (utxoId: string) =>
  poolOutputCache.delete(utxoId)

export const poolOutputExists = (utxoId: string) => poolOutputCache.has(utxoId)

export const getShareAssetNameByPoolUtxoId = (utxoId: string) =>
  poolOutputCache.get(utxoId)?.shareAssetName
