import type {RefTxIn} from '@meshsdk/core'
import {blake2bHex} from 'blakejs'

export const getShareAssetName = ({txHash, txIndex}: RefTxIn) => {
  if (txIndex > 255)
    throw new Error(
      `The output index of the first input (seed) does not fit into a byte: ${txIndex}`,
    )
  return blake2bHex(
    Buffer.from(`${txHash}${txIndex.toString(16).padStart(2, '0')}`, 'hex'),
    undefined,
    32,
  )
}
