import BigNumber from 'bignumber.js'

export const getTxFee = async (tx: string) => {
  const coreCsl = await import('@meshsdk/core-csl')
  const fee = coreCsl.csl.Transaction.from_hex(tx).body().fee().to_str()
  return new BigNumber(fee)
}
