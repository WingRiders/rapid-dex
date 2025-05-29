import {
  bigintToBigNumber,
  createUnit,
  isLovelaceUnit,
  sumBigNumbers,
} from '@wingriders/rapid-dex-common'
import BigNumber from 'bignumber.js'
import {prisma} from '../db/prismaClient'
import {getAdaValueFactory} from '../helpers/adaValue'
import {calculateAssetsAdaExchangeRates} from '../helpers/exchangeRates'
import {getLatestMempoolPoolOutput} from '../ogmios/mempool'

export const getTvl = async () => {
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
      qtyA: true,
      qtyB: true,
    },
  })

  const pools = poolOutputs.map((dbPoolOutput) => {
    const mempoolPoolOutput = getLatestMempoolPoolOutput(
      dbPoolOutput.shareAssetName,
      dbPoolOutput.utxoId,
    )
    const poolOutput = mempoolPoolOutput ?? dbPoolOutput

    return {
      unitA: createUnit(poolOutput.assetAPolicy, poolOutput.assetAName),
      unitB: createUnit(poolOutput.assetBPolicy, poolOutput.assetBName),
      shareAssetName: poolOutput.shareAssetName,
      poolState: {
        qtyA: bigintToBigNumber(poolOutput.qtyA),
        qtyB: bigintToBigNumber(poolOutput.qtyB),
      },
    }
  })

  const getAdaValue = getAdaValueFactory(calculateAssetsAdaExchangeRates(pools))

  const tvls = pools.map(
    (pool) =>
      getAdaValue(
        [
          {unit: pool.unitA, quantity: pool.poolState.qtyA.toString()},
          {unit: pool.unitB, quantity: pool.poolState.qtyB.toString()},
        ],
        isLovelaceUnit(pool.unitA) ? pool.shareAssetName : undefined,
      ) ?? new BigNumber(0),
  )

  return sumBigNumbers(tvls)
}
