import type {PoolOutput} from '@prisma/client'
import type {PoolDatum} from '@wingriders/rapid-dex-common'
import {
  dbPoolOutputToPool,
  dbPoolOutputToPoolState,
  dbPoolOutputToUtxo,
} from '../db/helpers'
import {
  emitPoolCreated,
  emitPoolStateUpdated,
  emitPoolUtxoUpdated,
} from '../poolsUpdates'
import {handleCrossServiceEvent} from '../redis/helpers'
import {PubSubChannel} from '../redis/pubsub'

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
  const validAt = new Date()

  if (hasSpentPoolInput) {
    handleCrossServiceEvent(
      PubSubChannel.POOL_STATE_UPDATED,
      {
        shareAssetName: poolDatum.sharesAssetName,
        poolState: dbPoolOutputToPoolState(poolOutput),
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
    handleCrossServiceEvent(
      PubSubChannel.POOL_CREATED,
      {
        pool: {
          ...dbPoolOutputToPool(poolOutput),
          validAt,
        },
      },
      emitPoolCreated,
    )
  }
}
