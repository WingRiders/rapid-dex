import {isServerMode} from '../config'
import {
  type PubSubChannel,
  type PubSubPayloads,
  publishToPubSub,
} from './pubsub'

/**
 * This function handles events that are triggered on the aggregator (e.g. during chainSync) and should be handled on the server
 * If the current service is running in the server or both mode, the event will be emitted directly
 * If the current service is running in the aggregator mode, the event will be published to Redis and handled by the server through PubSub
 */
export const handleCrossServiceEvent = async <TChannel extends PubSubChannel>(
  redisChannel: TChannel,
  payload: PubSubPayloads[TChannel],
  emit: (payload: PubSubPayloads[TChannel]) => void,
) => {
  if (isServerMode) {
    emit(payload)
  } else {
    await publishToPubSub(redisChannel, payload)
  }
}
