import {dbPoolOutputToPool} from '../db/helpers'
import {prisma} from '../db/prismaClient'
import {getLatestMempoolPoolOutput} from '../ogmios/mempool'

export const getPools = async () => {
  const validAt = new Date()

  const poolOutputs = await prisma.poolOutput.findMany({
    where: {
      spendSlot: null,
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
      swapFeePoints: true,
      feeBasis: true,
    },
  })

  return poolOutputs.map((dbPoolOutput) => {
    const mempoolPoolOutput = getLatestMempoolPoolOutput(
      dbPoolOutput.shareAssetName,
      dbPoolOutput.utxoId,
    )
    return {
      validAt,
      ...dbPoolOutputToPool(mempoolPoolOutput ?? dbPoolOutput),
    }
  })
}
