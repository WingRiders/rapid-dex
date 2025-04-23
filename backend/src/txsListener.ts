import {EventEmitter, on} from 'node:events'

export type TxsAddedToBlockPayload = {
  txHashes: string[]
}

type TxsListenerEvents = {
  txsAddedToBlock: [payload: TxsAddedToBlockPayload]
}

const txsListenerEmitter = new EventEmitter<TxsListenerEvents>()
txsListenerEmitter.setMaxListeners(Number.MAX_SAFE_INTEGER)

export const emitTxsAddedToBlock = (payload: TxsAddedToBlockPayload) => {
  txsListenerEmitter.emit('txsAddedToBlock', payload)
}

export const txsListenerEmitterIterable = <
  TEventName extends keyof TxsListenerEvents,
>(
  eventName: TEventName,
  options?: Parameters<typeof on>[2],
): AsyncIterable<TxsListenerEvents[TEventName]> =>
  on(txsListenerEmitter, eventName, options) as any
