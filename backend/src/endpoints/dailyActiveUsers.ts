import {resolveSlotNo} from '@meshsdk/core'
import {addDays} from 'date-fns'
import {config} from '../config'
import {prisma} from '../db/prismaClient'
import {getMempoolPoolOutputs} from '../ogmios/mempoolCache'

export const getDailyActiveUsers = async () => {
  const fromSlot = Number.parseInt(
    resolveSlotNo(config.NETWORK, addDays(new Date(), -1).getTime()),
  )

  const dbStakeKeyHashes = await prisma.poolOutput.findMany({
    distinct: ['createdByStakeKeyHash'],
    select: {
      createdByStakeKeyHash: true,
    },
    where: {
      slot: {
        gte: fromSlot,
      },
      createdByStakeKeyHash: {
        not: null,
      },
    },
  })

  const stakeKeyHashes = new Set(
    dbStakeKeyHashes.map((i) => i.createdByStakeKeyHash!),
  )

  // taking all mempool pool outputs into account
  const mempoolPoolOutputs = getMempoolPoolOutputs()

  mempoolPoolOutputs.forEach((output) => {
    if (output.createdByStakeKeyHash)
      stakeKeyHashes.add(output.createdByStakeKeyHash)
  })

  return stakeKeyHashes.size
}
