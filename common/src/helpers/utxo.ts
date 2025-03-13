import type {UTxO} from '@meshsdk/core'

export const matchUtxo = (input1: UTxO['input']) => (input2: UTxO['input']) =>
  input1.txHash === input2.txHash && input1.outputIndex === input2.outputIndex

export const utxoId = (utxo: UTxO['input']) =>
  `${utxo.txHash}#${utxo.outputIndex}`
