import {bigintToBigNumber, maxShareTokens} from '@wingriders/rapid-dex-common'
import {prisma} from '../db/prismaClient'

export const getPools = async () => {
  const pools = await prisma.poolOutput.findMany({
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

  return pools.map((pool) => ({
    ...pool,
    issuedShares: maxShareTokens.minus(bigintToBigNumber(pool.lpts)),
    qtyA: bigintToBigNumber(pool.qtyA),
    qtyB: bigintToBigNumber(pool.qtyB),
  }))
}
