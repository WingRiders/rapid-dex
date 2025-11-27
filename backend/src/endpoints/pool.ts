import {TRPCError} from '@trpc/server'
import {dbPoolOutputToPool, dbPoolOutputToUtxo} from '../db/helpers'
import {prisma} from '../db/prisma-client'
import {getLatestMempoolPoolOutput} from '../ogmios/mempool'

export const getPool = async (shareAssetName: string) => {
  const dbPoolOutput = await prisma.poolOutput.findFirst({
    where: {
      spendSlot: null,
      shareAssetName,
    },
    select: {
      utxoId: true,
      shareAssetName: true,
      assetAPolicy: true,
      assetAName: true,
      assetBPolicy: true,
      assetBName: true,
      lpts: true,
      qtyA: true,
      qtyB: true,
      feeBasis: true,
      swapFeePointsAToB: true,
      swapFeePointsBToA: true,
      treasuryFeePointsAToB: true,
      treasuryFeePointsBToA: true,
      feeFrom: true,
    },
  })

  const mempoolPoolOutput = getLatestMempoolPoolOutput(
    shareAssetName,
    dbPoolOutput?.utxoId,
  )

  const poolOutput = mempoolPoolOutput ?? dbPoolOutput

  if (!poolOutput) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `Pool ${shareAssetName} not found`,
    })
  }

  return dbPoolOutputToPool(poolOutput)
}

export const getPoolUtxo = async (shareAssetName: string) => {
  const validAt = new Date()

  const dbPoolOutput = await prisma.poolOutput.findFirst({
    where: {
      spendSlot: null,
      shareAssetName,
    },
    select: {
      shareAssetName: true,
      utxoId: true,
      assets: true,
      coins: true,
      datumCBOR: true,
      address: true,
    },
  })

  const mempoolPoolOutput = getLatestMempoolPoolOutput(
    shareAssetName,
    dbPoolOutput?.utxoId,
  )

  const poolOutput = mempoolPoolOutput ?? dbPoolOutput

  if (!poolOutput) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `UTxO for pool ${shareAssetName} not found`,
    })
  }

  return {utxo: dbPoolOutputToUtxo(poolOutput), validAt}
}
