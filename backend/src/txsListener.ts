import {EventEmitter, on} from 'node:events'

type TxsListenerEvents = {
  txAddedToBlock: [txHash: string]
}

const txsListenerEmitter = new EventEmitter<TxsListenerEvents>()
txsListenerEmitter.setMaxListeners(Number.MAX_SAFE_INTEGER)

export const emitTxAddedToBlock = (txHash: string) => {
  txsListenerEmitter.emit('txAddedToBlock', txHash)
}

export const txsListenerEmitterIterable = <
  TEventName extends keyof TxsListenerEvents,
>(
  eventName: TEventName,
  options?: Parameters<typeof on>[2],
): AsyncIterable<TxsListenerEvents[TEventName]> =>
  on(txsListenerEmitter, eventName, options) as any
