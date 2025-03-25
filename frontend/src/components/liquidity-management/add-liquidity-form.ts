import {useTokenMetadata} from '@/metadata/queries'
import {useConnectedWalletStore} from '@/store/connected-wallet'
import type {PoolsListItem} from '@/types'
import {useWalletBalanceQuery} from '@/wallet/queries'
import type {PoolState} from '@wingriders/rapid-dex-common'
import BigNumber from 'bignumber.js'
import {useCallback, useMemo, useState} from 'react'

const getPoolRatio = (poolState: Pick<PoolState, 'qtyA' | 'qtyB'>) =>
  poolState.qtyA.div(poolState.qtyB)

export type AddLiquidityFormValues = {
  quantityA: BigNumber | null
  quantityB: BigNumber | null
}

type UseAddLiquidityFormArgs = {
  pool: PoolsListItem
}

export const useAddLiquidityForm = ({pool}: UseAddLiquidityFormArgs) => {
  const [addLiquidityFormValues, setAddLiquidityFormValues] =
    useState<AddLiquidityFormValues>({
      quantityA: null,
      quantityB: null,
    })

  const onQuantityAChange = useCallback(
    (value: BigNumber | null) => {
      setAddLiquidityFormValues({
        quantityA: value,
        quantityB: value?.gt(0)
          ? (value
              .div(getPoolRatio(pool.poolState))
              .integerValue(BigNumber.ROUND_CEIL) ?? null)
          : addLiquidityFormValues.quantityB,
      })
    },
    [addLiquidityFormValues.quantityB, pool.poolState],
  )

  const onQuantityBChange = useCallback(
    (value: BigNumber | null) => {
      setAddLiquidityFormValues({
        quantityA: value?.gt(0)
          ? (value
              .times(getPoolRatio(pool.poolState))
              .integerValue(BigNumber.ROUND_CEIL) ?? null)
          : addLiquidityFormValues.quantityA,
        quantityB: value,
      })
    },
    [addLiquidityFormValues.quantityA, pool.poolState],
  )

  const resetAddLiquidityForm = useCallback(() => {
    setAddLiquidityFormValues({
      quantityA: null,
      quantityB: null,
    })
  }, [])

  return {
    addLiquidityFormValues,
    onQuantityAChange,
    onQuantityBChange,
    resetAddLiquidityForm,
  }
}

type ValidateAddLiquidityFormParams = {
  values: AddLiquidityFormValues
  pool: PoolsListItem
  earnedShares: BigNumber | undefined
}

export const useValidateAddLiquidityForm = ({
  values: {quantityA, quantityB},
  pool,
  earnedShares,
}: ValidateAddLiquidityFormParams) => {
  const isWalletConnected = useConnectedWalletStore(
    (state) => state.connectedWallet != null,
  )
  const {data: balance} = useWalletBalanceQuery()

  const {metadata: unitAMetadata} = useTokenMetadata(pool.unitA)
  const {metadata: unitBMetadata} = useTokenMetadata(pool.unitB)

  return useMemo<string | undefined>(() => {
    if (!isWalletConnected) return 'Connect your wallet'

    if (!quantityA?.gt(0) || !quantityB?.gt(0)) return 'Enter quantities'

    // earnedShares should be defined if both quantities are defined
    if (!earnedShares) return 'Something went wrong'

    if (!earnedShares.gt(0)) {
      return 'Enter larger quantities'
    }

    const balanceA = balance?.[pool.unitA] ?? new BigNumber(0)
    const balanceB = balance?.[pool.unitB] ?? new BigNumber(0)

    const getInsufficientBalanceError = (ticker: string | undefined) =>
      ticker ? `Insufficient balance of ${ticker}` : 'Insufficient balance'

    if (quantityA?.gt(balanceA))
      return getInsufficientBalanceError(unitAMetadata?.ticker)

    if (quantityB?.gt(balanceB))
      return getInsufficientBalanceError(unitBMetadata?.ticker)

    return undefined
  }, [
    balance,
    isWalletConnected,
    pool,
    unitAMetadata,
    unitBMetadata,
    quantityA,
    quantityB,
    earnedShares,
  ])
}
