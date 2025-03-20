import type {UTxO} from '@meshsdk/core'

const TX_HASH_LENGTH = 64

export const matchUtxo = (input1: UTxO['input']) => (input2: UTxO['input']) =>
  input1.txHash === input2.txHash && input1.outputIndex === input2.outputIndex

export const getUtxoId = (utxo: UTxO['input']) =>
  `${utxo.txHash}#${utxo.outputIndex}`

export const parseUtxoId = (utxoId: string): UTxO['input'] => {
  const [txHash, outputIndexRaw] = utxoId.split('#')
  const outputIndex = Number(outputIndexRaw)

  if (
    !txHash ||
    txHash.length !== TX_HASH_LENGTH ||
    !outputIndexRaw ||
    Number.isNaN(outputIndex) ||
    outputIndex < 0
  ) {
    throw new Error(`Invalid utxoId: ${utxoId}`)
  }
  return {txHash, outputIndex}
}
