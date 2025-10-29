import EventEmitter, {on} from 'node:events'
import type {Interaction} from '@wingriders/rapid-dex-common'

export type InteractionUpdatedPayload = {
  stakeKeyHash: string
  interaction: Interaction
}

type InteractionsUpdatesEvents = {
  interactionUpdated: [payload: InteractionUpdatedPayload]
}

const interactionsUpdatesEventEmitter =
  new EventEmitter<InteractionsUpdatesEvents>()
interactionsUpdatesEventEmitter.setMaxListeners(Number.MAX_SAFE_INTEGER)

export const emitInteractionUpdated = (payload: InteractionUpdatedPayload) => {
  interactionsUpdatesEventEmitter.emit('interactionUpdated', payload)
}

export const interactionsUpdatesEventEmitterIterable = <
  TEventName extends keyof InteractionsUpdatesEvents,
>(
  eventName: TEventName,
  options?: Parameters<typeof on>[2],
): AsyncIterable<InteractionsUpdatesEvents[TEventName]> =>
  on(interactionsUpdatesEventEmitter, eventName, options) as any
