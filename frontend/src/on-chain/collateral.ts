import type {IWallet, UTxO} from '@meshsdk/core'
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

export const getWalletCollateralUtxo = async (
  wallet: IWallet,
  walletUtxos?: UTxO[],
): Promise<UTxO | undefined> => {
  // first, try to get the collateral from the wallet API
  const collateral = await wallet.getCollateral()
  if (collateral.length > 0) return collateral[0]!

  // if that doesn't return anything, try to use any suitable regular UTxO as a collateral
  const utxos = walletUtxos ?? (await wallet.getUtxos())
  return utxos.find(isCollateralUtxo)
}
