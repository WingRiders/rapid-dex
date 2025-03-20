import {
  type PoolState,
  bigintToBigNumber,
  createUnit,
  maxShareTokens,
} from '@wingriders/rapid-dex-common'
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

  return pools.map((pool) => {
    const poolState: PoolState = {
      qtyA: bigintToBigNumber(pool.qtyA),
      qtyB: bigintToBigNumber(pool.qtyB),
      issuedShares: maxShareTokens.minus(bigintToBigNumber(pool.lpts)),
    }
    return {
      unitA: createUnit(pool.assetAPolicy, pool.assetAName),
      unitB: createUnit(pool.assetBPolicy, pool.assetBName),
      shareAssetName: pool.shareAssetName,
      poolState,
      swapFeePoints: pool.swapFeePoints,
      feeBasis: pool.feeBasis,
    }
  })
}
