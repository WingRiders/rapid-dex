import type {PoolOutput} from '@prisma/client'
import {
  type PoolDatum,
  createUnit,
  isLovelaceUnit,
} from '@wingriders/rapid-dex-common'
import {
  dbPoolOutputToPool,
  dbPoolOutputToPoolState,
  dbPoolOutputToUtxo,
} from '../db/helpers'
import {logger} from '../logger'
import {getAssetsAdaExchangeRatesCache} from '../ogmios/exchangeRatesCache'
import {
  emitPoolCreated,
  emitPoolStateUpdated,
  emitPoolUtxoUpdated,
} from '../poolsUpdates'
import {handleCrossServiceEvent} from '../redis/helpers'
import {PubSubChannel} from '../redis/pubsub'
import {getAdaValueFactory} from './adaValue'

type HandleNewPoolOutputEventsArgs = {
  poolOutput: Pick<
    PoolOutput,
    | 'assetAPolicy'
    | 'assetAName'
    | 'assetBPolicy'
    | 'assetBName'
    | 'shareAssetName'
    | 'swapFeePoints'
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
  poolDatum: PoolDatum
  hasSpentPoolInput: boolean
}
export const handleNewPoolOutputEvents = ({
  poolOutput,
  poolDatum,
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
    const unitA = createUnit(poolDatum.aPolicyId, poolDatum.aAssetName)
    const unitB = createUnit(poolDatum.bPolicyId, poolDatum.bAssetName)

    handleCrossServiceEvent(
      PubSubChannel.POOL_STATE_UPDATED,
      {
        shareAssetName: poolDatum.sharesAssetName,
        poolState,
        tvlInAda: getAdaValue(
          [
            {unit: unitA, quantity: poolState.qtyA.toString()},
            {unit: unitB, quantity: poolState.qtyB.toString()},
          ],
          isLovelaceUnit(unitA) ? poolDatum.sharesAssetName : undefined,
        ),
        validAt,
      },
      emitPoolStateUpdated,
    )
    handleCrossServiceEvent(
      PubSubChannel.POOL_UTXO_UPDATED,
      {
        shareAssetName: poolDatum.sharesAssetName,
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
