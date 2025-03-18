import BigNumber from 'bignumber.js'
import {useMemo} from 'react'
import {useTokenMetadata} from '../../../metadata/queries'
import {useConnectedWalletStore} from '../../../store/connected-wallet'
import {useWalletBalanceQuery} from '../../../wallet/queries'
import type {CreatePoolFormInputs} from './types'

type ValidateCreatePoolFormParams = {
  inputs: CreatePoolFormInputs
  earnedShares: BigNumber | undefined
}

export const useValidateCreatePoolForm = ({
  inputs,
  earnedShares,
}: ValidateCreatePoolFormParams) => {
  const isWalletConnected = useConnectedWalletStore(
    (state) => state.connectedWallet != null,
  )
  const {data: balance} = useWalletBalanceQuery()

  const {metadata: assetXMetadata} = useTokenMetadata(inputs.assetX.unit)
  const {metadata: assetYMetadata} = useTokenMetadata(inputs.assetY.unit)

  return useMemo<string | undefined>(() => {
    if (!isWalletConnected) {
      return 'Connect your wallet'
    }

    const {assetX, assetY} = inputs

    if (!assetX.unit || !assetY.unit || !assetX.quantity || !assetY.quantity) {
      return 'Enter both assets and their quantities'
    }

    // earnedShares should be defined if both quantities are defined
    if (!earnedShares) return 'Something went wrong'

    if (!earnedShares.gt(0)) {
      return 'Enter larger quantities'
    }
    if (assetX.unit === assetY.unit) {
      return 'Enter different assets'
    }

    const assetXBalance = balance?.[assetX.unit] ?? new BigNumber(0)
    const assetYBalance = balance?.[assetY.unit] ?? new BigNumber(0)

    const getInsufficientBalanceError = (ticker: string | undefined) =>
      ticker ? `Insufficient balance of ${ticker}` : 'Insufficient balance'

    if (assetX.quantity.gt(assetXBalance)) {
      return getInsufficientBalanceError(assetXMetadata?.ticker)
    }

    if (assetY.quantity.gt(assetYBalance)) {
      return getInsufficientBalanceError(assetYMetadata?.ticker)
    }

    return undefined
  }, [
    balance,
    isWalletConnected,
    inputs,
    assetXMetadata,
    assetYMetadata,
    earnedShares,
  ])
}
