import {prisma} from '@/db/prismaClient'
import {bigintToBigNumber, maxShareTokens} from '@wingriders/rapid-dex-common'

export const getPool = async (shareAssetName: string) => {
  const pool = await prisma.poolOutput.findFirstOrThrow({
    where: {
      spendSlot: null,
      shareAssetName,
    },
    omit: {
      spendUtxoId: true,
      spendSlot: true,
    },
  })

  return {
    ...pool,
    issuedShares: maxShareTokens.minus(bigintToBigNumber(pool.lpts)),
    qtyA: bigintToBigNumber(pool.qtyA),
    qtyB: bigintToBigNumber(pool.qtyB),
  }
}
