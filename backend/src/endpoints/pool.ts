import {prisma} from '@/db/prismaClient'
import {bigintToBigNumber, maxShareTokens} from '@wingriders/rapid-dex-common'
import BigNumber from 'bignumber.js'
import {z} from 'zod'

export const getPool = async (shareAssetName: string) => {
  const pool = await prisma.poolOutput.findFirstOrThrow({
    where: {
      spendSlot: null,
      shareAssetName,
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
      assets: true,
      coins: true,
      datumCBOR: true,
      txMetadata: true,
      scriptCBOR: true,
      scriptVersion: true,
    },
  })

  const assetsSchema = z.array(
    z
      .object({
        unit: z.string(),
        quantity: z.string(),
      })
      .transform(({unit, quantity}) => ({
        unit,
        quantity: new BigNumber(quantity),
      })),
  )

  return {
    ...pool,
    issuedShares: maxShareTokens.minus(bigintToBigNumber(pool.lpts)),
    qtyA: bigintToBigNumber(pool.qtyA),
    qtyB: bigintToBigNumber(pool.qtyB),
    assets: assetsSchema
      .parse(pool.assets)
      .map(({unit, quantity}) => ({unit, quantity: new BigNumber(quantity)})),
    coins: bigintToBigNumber(pool.coins),
  }
}
