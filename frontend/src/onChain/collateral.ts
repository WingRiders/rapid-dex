import type {UTxO} from '@meshsdk/core'
import BigNumber from 'bignumber.js'

const COLLATERAL_MIN_LOVELACE_AMOUNT = new BigNumber(3_000_000)
const COLLATERAL_MAX_LOVELACE_AMOUNT = new BigNumber(5_000_000)

export const isCollateralUtxo = (utxo: UTxO) => {
  if (
    utxo.output.amount.length !== 1 ||
    utxo.output.amount[0].unit !== 'lovelace'
  )
    return false

  const lovelaceAmount = new BigNumber(utxo.output.amount[0].quantity)

  return (
    lovelaceAmount.gte(COLLATERAL_MIN_LOVELACE_AMOUNT) &&
    lovelaceAmount.lte(COLLATERAL_MAX_LOVELACE_AMOUNT)
  )
}
