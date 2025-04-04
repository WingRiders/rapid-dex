import {
  type TransactionSubmission,
  createTransactionSubmissionClient,
} from '@cardano-ogmios/client'
import {getOgmiosContext} from './ogmios'

let txSubmissionClient: TransactionSubmission.TransactionSubmissionClient | null =
  null

export const initializeTxSubmissionClient = async () => {
  if (txSubmissionClient != null) return

  const ogmiosContext = await getOgmiosContext()
  txSubmissionClient = await createTransactionSubmissionClient(ogmiosContext)
  ogmiosContext.socket.addEventListener('close', () =>
    initializeTxSubmissionClient(),
  )
}

export const submitTx = (signedTxBody: string) => {
  if (txSubmissionClient === null) {
    throw new Error('TxSubmission client not initialized')
  }
  return txSubmissionClient.submitTransaction(signedTxBody)
}
