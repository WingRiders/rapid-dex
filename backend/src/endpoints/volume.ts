import {resolveSlotNo} from '@meshsdk/core'
import {
  bigintToBigNumber,
  createUnit,
  isLovelaceUnit,
  sumBigNumbers,
} from '@wingriders/rapid-dex-common'
import BigNumber from 'bignumber.js'
import {addHours} from 'date-fns'
import {keyBy} from 'lodash'
import {config} from '../config'
import {prisma} from '../db/prismaClient'
import {getAdaValueFactory} from '../helpers/adaValue'
import {calculateAssetsAdaExchangeRates} from '../helpers/exchangeRates'
import {getMempoolPoolOutputsForPool} from '../ogmios/mempoolCache'

export const getPoolsVolume = async (hoursOffset: number) => {
  const fromSlot = Number.parseInt(
    resolveSlotNo(config.NETWORK, addHours(new Date(), -hoursOffset).getTime()),
  )

  const [allDbPools, dbVolumes] = await Promise.all([
    prisma.poolOutput.findMany({
      where: {
        spendSlot: null,
      },
      select: {
        shareAssetName: true,
        assetAPolicy: true,
        assetAName: true,
        assetBPolicy: true,
        assetBName: true,
        qtyA: true,
        qtyB: true,
      },
    }),
    prisma.poolOutput.groupBy({
      by: ['shareAssetName'],
      _sum: {
        volumeA: true,
        volumeB: true,
        outputVolumeA: true,
        outputVolumeB: true,
      },
      where: {
        slot: {
          gt: fromSlot,
        },
      },
    }),
  ])

  const allPools = allDbPools.map((p) => ({
    shareAssetName: p.shareAssetName,
    unitA: createUnit(p.assetAPolicy, p.assetAName),
    unitB: createUnit(p.assetBPolicy, p.assetBName),
    poolState: {
      qtyA: bigintToBigNumber(p.qtyA),
      qtyB: bigintToBigNumber(p.qtyB),
    },
  }))
  const dbVolumesByShareAssetName = keyBy(dbVolumes, (v) => v.shareAssetName)

  const getAdaValue = getAdaValueFactory(
    calculateAssetsAdaExchangeRates(allPools),
  )

  const poolsWithVolume = allPools.map((pool) => {
    const dbVolume = dbVolumesByShareAssetName[pool.shareAssetName]?._sum

    // taking all mempool pool outputs into account, regardless the hours offset
    const mempoolVolume = getMempoolPoolOutputsForPool(
      pool.shareAssetName,
    )?.reduce(
      (acc, curr) => ({
        volumeA: acc.volumeA + curr.volumeA,
        volumeB: acc.volumeB + curr.volumeB,
        outputVolumeA: acc.outputVolumeA + curr.outputVolumeA,
        outputVolumeB: acc.outputVolumeB + curr.outputVolumeB,
      }),
      {
        volumeA: 0n,
        volumeB: 0n,
        outputVolumeA: 0n,
        outputVolumeB: 0n,
      },
    )

    const sumVolume = (
      key: keyof Exclude<typeof dbVolume | typeof mempoolVolume, undefined>,
    ) =>
      bigintToBigNumber((dbVolume?.[key] ?? 0n) + (mempoolVolume?.[key] ?? 0n))

    const totalVolume = {
      volumeA: sumVolume('volumeA'),
      volumeB: sumVolume('volumeB'),
      outputVolumeA: sumVolume('outputVolumeA'),
      outputVolumeB: sumVolume('outputVolumeB'),
    }

    const volume = isLovelaceUnit(pool.unitA)
      ? totalVolume.volumeA.plus(totalVolume.outputVolumeA)
      : getAdaValue(
          [
            {unit: pool.unitA, quantity: totalVolume.volumeA.toString()},
            {unit: pool.unitB, quantity: totalVolume.volumeB.toString()},
          ],
          undefined,
        )
    return [pool.shareAssetName, volume] as const
  })

  return Object.fromEntries(poolsWithVolume)
}

export const getVolume = async (hoursOffset: number) => {
  const poolsVolume = await getPoolsVolume(hoursOffset)

  return sumBigNumbers(
    Object.values(poolsVolume).map((v) => v ?? new BigNumber(0)),
  )
}
