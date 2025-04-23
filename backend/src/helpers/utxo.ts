import type {TransactionOutputReference} from '@cardano-ogmios/schema'
import type {UTxO} from '@meshsdk/core'

export const txOutRefToUtxoInput = (
  ref: TransactionOutputReference,
): UTxO['input'] => ({
  txHash: ref.transaction.id,
  outputIndex: ref.index,
})
