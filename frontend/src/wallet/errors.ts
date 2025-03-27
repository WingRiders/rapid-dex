export enum TxSignErrorCode {
  /**
   * User has accepted the transaction sign, but the wallet was unable to sign the transaction
   * (e.g. not having some of the private keys)
   */
  ProofGeneration = 1,
  /**
   * User declined to sign the transaction
   */
  UserDeclined = 2,
}

export const getTxSignErrorMessage = (error: Error): string => {
  if ('code' in error && error.code === TxSignErrorCode.UserDeclined)
    return 'Transaction was declined'
  if ('info' in error && typeof error.info === 'string') return error.info
  return error.message ?? 'Unknown error'
}

export const getTxSendErrorMessage = (error: Error): string => {
  if ('info' in error && typeof error.info === 'string') return error.info
  return error.message ?? 'Unknown error'
}
