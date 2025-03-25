import {dbPoolOutputToUtxo} from '../db/helpers'
import {prisma} from '../db/prismaClient'

export const getPoolUtxo = async (shareAssetName: string) => {
  const validAt = new Date()

  const poolOutput = await prisma.poolOutput.findFirstOrThrow({
    where: {
      spendSlot: null,
      shareAssetName,
    },
    select: {
      utxoId: true,
      assets: true,
      coins: true,
      datumCBOR: true,
      address: true,
    },
  })

  return {utxo: dbPoolOutputToUtxo(poolOutput), validAt}
}
