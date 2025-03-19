import type {UTxO} from '@meshsdk/core'
import {isLovelaceUnit} from '@wingriders/rapid-dex-common'
import BigNumber from 'bignumber.js'

const COLLATERAL_MIN_LOVELACE_AMOUNT = new BigNumber(3_000_000)
const COLLATERAL_MAX_LOVELACE_AMOUNT = new BigNumber(5_000_000)

export const isCollateralUtxo = (utxo: UTxO) => {
  if (
    utxo.output.amount.length !== 1 ||
    !isLovelaceUnit(utxo.output.amount[0]!.unit)
  )
    return false

  const lovelaceAmount = new BigNumber(utxo.output.amount[0]!.quantity)

  return (
    lovelaceAmount.gte(COLLATERAL_MIN_LOVELACE_AMOUNT) &&
    lovelaceAmount.lte(COLLATERAL_MAX_LOVELACE_AMOUNT)
  )
}
