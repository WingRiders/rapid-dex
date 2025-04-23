import {dbPoolOutputToUtxo} from '../db/helpers'
import {prisma} from '../db/prismaClient'
import {getLatestMempoolPoolOutput} from '../ogmios/mempool'

export const getPoolUtxo = async (shareAssetName: string) => {
  const validAt = new Date()

  const dbPoolOutput = await prisma.poolOutput.findFirstOrThrow({
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
    dbPoolOutput.shareAssetName,
    dbPoolOutput.utxoId,
  )

  return {utxo: dbPoolOutputToUtxo(mempoolPoolOutput ?? dbPoolOutput), validAt}
}
