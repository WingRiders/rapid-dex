import type {PoolOutput} from '@prisma/client'
import {createUnit, isLovelaceUnit} from '@wingriders/rapid-dex-common'
import {
  dbPoolOutputToPool,
  dbPoolOutputToPoolState,
  dbPoolOutputToUtxo,
} from '../db/helpers'
import {logger} from '../logger'
import {getAssetsAdaExchangeRatesCache} from '../ogmios/exchange-rates-cache'
import {
  emitPoolCreated,
  emitPoolStateUpdated,
  emitPoolUtxoUpdated,
} from '../pools-updates'
import {handleCrossServiceEvent} from '../redis/helpers'
import {PubSubChannel} from '../redis/pubsub'
import {getAdaValueFactory} from './ada-value'

type HandleNewPoolOutputEventsArgs = {
  poolOutput: Pick<
    PoolOutput,
    | 'assetAPolicy'
    | 'assetAName'
    | 'assetBPolicy'
    | 'assetBName'
    | 'treasuryA'
    | 'treasuryB'
    | 'shareAssetName'
    | 'feeFrom'
    | 'swapFeePointsAToB'
    | 'swapFeePointsBToA'
    | 'treasuryFeePointsAToB'
    | 'treasuryFeePointsBToA'
    | 'treasuryAuthorityPolicy'
    | 'treasuryAuthorityName'
    | 'feeBasis'
    | 'lpts'
    | 'qtyA'
    | 'qtyB'
    | 'utxoId'
    | 'address'
    | 'assets'
    | 'coins'
    | 'datumCBOR'
  >
  hasSpentPoolInput: boolean
}
export const handleNewPoolOutputEvents = ({
  poolOutput,
  hasSpentPoolInput,
}: HandleNewPoolOutputEventsArgs) => {
  logger.debug(
    {utxoId: poolOutput.utxoId},
    'Sending WebSocket pool updates to clients',
  )

  const validAt = new Date()

  const getAdaValue = getAdaValueFactory(getAssetsAdaExchangeRatesCache())

  if (hasSpentPoolInput) {
    const poolState = dbPoolOutputToPoolState(poolOutput)
    const unitA = createUnit(poolOutput.assetAPolicy, poolOutput.assetAName)
    const unitB = createUnit(poolOutput.assetBPolicy, poolOutput.assetBName)

    handleCrossServiceEvent(
      PubSubChannel.POOL_STATE_UPDATED,
      {
        shareAssetName: poolOutput.shareAssetName,
        poolState,
        tvlInAda: getAdaValue(
          [
            {unit: unitA, quantity: poolState.qtyA.toString()},
            {unit: unitB, quantity: poolState.qtyB.toString()},
          ],
          isLovelaceUnit(unitA) ? poolOutput.shareAssetName : undefined,
        ),
        validAt,
      },
      emitPoolStateUpdated,
    )
    handleCrossServiceEvent(
      PubSubChannel.POOL_UTXO_UPDATED,
      {
        shareAssetName: poolOutput.shareAssetName,
        utxo: dbPoolOutputToUtxo(poolOutput),
        validAt,
      },
      emitPoolUtxoUpdated,
    )
  } else {
    const pool = dbPoolOutputToPool(poolOutput)
    handleCrossServiceEvent(
      PubSubChannel.POOL_CREATED,
      {
        pool: {
          ...pool,
          tvlInAda: getAdaValue(
            [
              {unit: pool.unitA, quantity: pool.poolState.qtyA.toString()},
              {unit: pool.unitB, quantity: pool.poolState.qtyB.toString()},
            ],
            isLovelaceUnit(pool.unitA) ? pool.shareAssetName : undefined,
          ),
          validAt,
        },
      },
      emitPoolCreated,
    )
  }
}
