import {EventEmitter, on} from 'node:events'

export type TxAddedToBlockPayload = {
  txHash: string
}

type TxsListenerEvents = {
  txAddedToBlock: [payload: TxAddedToBlockPayload]
}

const txsListenerEmitter = new EventEmitter<TxsListenerEvents>()
txsListenerEmitter.setMaxListeners(Number.MAX_SAFE_INTEGER)

export const emitTxAddedToBlock = (payload: TxAddedToBlockPayload) => {
  txsListenerEmitter.emit('txAddedToBlock', payload)
}

export const txsListenerEmitterIterable = <
  TEventName extends keyof TxsListenerEvents,
>(
  eventName: TEventName,
  options?: Parameters<typeof on>[2],
): AsyncIterable<TxsListenerEvents[TEventName]> =>
  on(txsListenerEmitter, eventName, options) as any
