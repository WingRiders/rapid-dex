import {TRPCError} from '@trpc/server'
import {dbPoolOutputToUtxo} from '../db/helpers'
import {prisma} from '../db/prismaClient'
import {getLatestMempoolPoolOutput} from '../ogmios/mempool'

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
