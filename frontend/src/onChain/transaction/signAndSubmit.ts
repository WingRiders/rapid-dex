import type {BrowserWallet} from '@meshsdk/core'

type SignAndSubmitTxArgs = {
  tx: string
  wallet: BrowserWallet
  partialSign?: boolean
}

export type SignAndSubmitTxResult = {
  txHash: string
}

export const signAndSubmitTx = async ({
  tx,
  wallet,
  partialSign,
}: SignAndSubmitTxArgs): Promise<SignAndSubmitTxResult> => {
  const signedTx = await wallet.signTx(tx, partialSign)
  const txHash = await wallet.submitTx(signedTx)
  return {txHash}
}
