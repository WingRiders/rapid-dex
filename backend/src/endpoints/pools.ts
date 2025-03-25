import {} from '@wingriders/rapid-dex-common'
import {dbPoolOutputToPool} from '../db/helpers'
import {prisma} from '../db/prismaClient'

export const getPools = async () => {
  const validAt = new Date()

  const poolOutputs = await prisma.poolOutput.findMany({
    where: {
      spendSlot: null,
    },
    select: {
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

  return poolOutputs.map((poolOutput) => ({
    validAt,
    ...dbPoolOutputToPool(poolOutput),
  }))
}
