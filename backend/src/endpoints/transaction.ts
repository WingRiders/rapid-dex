import {prisma} from '../db/prismaClient'

export const isPoolTxInBlock = async (txHash: string) => {
  const poolOutput = await prisma.poolOutput.findFirst({
    select: {
      utxoId: true,
    },
    where: {
      utxoId: {
        startsWith: txHash,
      },
    },
  })

  return {
    isInBlock: poolOutput != null,
    txHash,
  }
}
