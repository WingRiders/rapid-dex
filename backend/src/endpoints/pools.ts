import {isLovelaceUnit, sortPools} from '@wingriders/rapid-dex-common'
import {dbPoolOutputToPool} from '../db/helpers'
import {prisma} from '../db/prisma-client'
import {getAdaValueFactory} from '../helpers/ada-value'
import {calculateAssetsAdaExchangeRates} from '../helpers/exchange-rates'
import {getLatestMempoolPoolOutput} from '../ogmios/mempool'
import {getMempoolPoolOutputs} from '../ogmios/mempool-cache'

export const getPools = async () => {
  const validAt = new Date()

  const dbPoolOutputs = await prisma.poolOutput.findMany({
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
      feeFrom: true,
      swapFeePointsAToB: true,
      swapFeePointsBToA: true,
      treasuryFeePointsAToB: true,
      treasuryFeePointsBToA: true,
      feeBasis: true,
    },
  })

  const dbPools = dbPoolOutputs.map((dbPoolOutput) => {
    const mempoolPoolOutput = getLatestMempoolPoolOutput(
      dbPoolOutput.shareAssetName,
      dbPoolOutput.utxoId,
    )
    return {
      validAt,
      ...dbPoolOutputToPool(mempoolPoolOutput ?? dbPoolOutput),
    }
  })
  const dbPoolsShareAssetNames = new Set<string>(
    dbPools.map((p) => p.shareAssetName),
  )

  const mempoolPoolOutputs = getMempoolPoolOutputs()
  // newly created pools that are only in the mempool
  const mempoolOnlyPoolOutputs = mempoolPoolOutputs.filter(
    (o) => !dbPoolsShareAssetNames.has(o.shareAssetName),
  )

  const onlyMempoolPools = mempoolOnlyPoolOutputs.map((mempoolPoolOutput) => ({
    validAt,
    ...dbPoolOutputToPool(mempoolPoolOutput),
  }))

  const pools = [...dbPools, ...onlyMempoolPools]

  const getAdaValue = getAdaValueFactory(calculateAssetsAdaExchangeRates(pools))

  return pools
    .map((pool) => ({
      ...pool,
      tvlInAda: getAdaValue(
        [
          {unit: pool.unitA, quantity: pool.poolState.qtyA.toString()},
          {unit: pool.unitB, quantity: pool.poolState.qtyB.toString()},
        ],
        isLovelaceUnit(pool.unitA) ? pool.shareAssetName : undefined,
      ),
    }))
    .sort(sortPools)
}
