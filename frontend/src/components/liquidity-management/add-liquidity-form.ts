import type {PoolState} from '@wingriders/rapid-dex-common'
import BigNumber from 'bignumber.js'
import {useCallback, useMemo, useState} from 'react'
import {useTokenMetadata} from '@/metadata/queries'
import {useConnectedWalletStore} from '@/store/connected-wallet'
import type {PoolsListItem} from '@/types'
import {useWalletBalanceQuery} from '@/wallet/queries'

const getPoolRatio = (poolState: Pick<PoolState, 'qtyA' | 'qtyB'>) =>
  poolState.qtyA.div(poolState.qtyB)

export type AddLiquidityFormValues = {
  isZapIn: boolean
  quantityA: BigNumber | null
  quantityB: BigNumber | null
  lastTouched?: 'quantityA' | 'quantityB'
}

type UseAddLiquidityFormArgs = {
  pool: PoolsListItem
}

const calculateQuantityBBasedOnQuantityA = (
  quantityA: BigNumber,
  poolState: PoolState,
) => quantityA.div(getPoolRatio(poolState)).integerValue(BigNumber.ROUND_CEIL)

const calculateQuantityABasedOnQuantityB = (
  quantityB: BigNumber,
  poolState: PoolState,
) => quantityB.times(getPoolRatio(poolState)).integerValue(BigNumber.ROUND_CEIL)

export const useAddLiquidityForm = ({pool}: UseAddLiquidityFormArgs) => {
  const [addLiquidityFormValues, setAddLiquidityFormValues] =
    useState<AddLiquidityFormValues>({
      isZapIn: false,
      quantityA: null,
      quantityB: null,
    })

  const onQuantityAChange = useCallback(
    (value: BigNumber | null) => {
      setAddLiquidityFormValues((prevState) => ({
        ...prevState,
        quantityA: value,
        quantityB: value?.gt(0)
          ? prevState.isZapIn
            ? new BigNumber(0)
            : calculateQuantityBBasedOnQuantityA(value, pool.poolState)
          : addLiquidityFormValues.quantityB,
        lastTouched: 'quantityA',
      }))
    },
    [addLiquidityFormValues.quantityB, pool.poolState],
  )

  const onQuantityBChange = useCallback(
    (value: BigNumber | null) => {
      setAddLiquidityFormValues((prevState) => ({
        ...prevState,
        quantityA: value?.gt(0)
          ? prevState.isZapIn
            ? new BigNumber(0)
            : calculateQuantityABasedOnQuantityB(value, pool.poolState)
          : addLiquidityFormValues.quantityA,
        quantityB: value,
        lastTouched: 'quantityB',
      }))
    },
    [addLiquidityFormValues.quantityA, pool.poolState],
  )

  const resetAddLiquidityForm = useCallback(() => {
    setAddLiquidityFormValues((prevState) => ({
      ...prevState,
      quantityA: null,
      quantityB: null,
      lastTouched: undefined,
    }))
  }, [])

  const onIsZapInChange = useCallback(
    (isZapIn: boolean) => {
      setAddLiquidityFormValues((prevState) => {
        const lastTouched = prevState.lastTouched ?? 'quantityA'

        const newQuantityA = (() => {
          if (isZapIn)
            return lastTouched === 'quantityA'
              ? prevState.quantityA
              : prevState.quantityB
                ? new BigNumber(0)
                : null

          if (lastTouched === 'quantityA') return prevState.quantityA

          return prevState.quantityB?.gt(0)
            ? calculateQuantityABasedOnQuantityB(
                prevState.quantityB,
                pool.poolState,
              )
            : null
        })()

        const newQuantityB = (() => {
          if (isZapIn)
            return lastTouched === 'quantityB'
              ? prevState.quantityB
              : prevState.quantityA
                ? new BigNumber(0)
                : null

          if (lastTouched === 'quantityB') return prevState.quantityB

          return prevState.quantityA?.gt(0)
            ? calculateQuantityBBasedOnQuantityA(
                prevState.quantityA,
                pool.poolState,
              )
            : null
        })()

        return {
          ...prevState,
          quantityA: newQuantityA,
          quantityB: newQuantityB,
          isZapIn,
        }
      })
    },
    [pool.poolState],
  )

  return {
    addLiquidityFormValues,
    onQuantityAChange,
    onQuantityBChange,
    onIsZapInChange,
    resetAddLiquidityForm,
  }
}

type ValidateAddLiquidityFormParams = {
  values: AddLiquidityFormValues
  pool: PoolsListItem
  earnedShares: BigNumber | undefined
}

export const useValidateAddLiquidityForm = ({
  values: {isZapIn, quantityA, quantityB},
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

    if (isZapIn) {
      if (quantityA == null && quantityB == null) return 'Enter quantity'
    } else {
      if (!quantityA?.gt(0) || !quantityB?.gt(0)) return 'Enter quantities'
    }

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
    isZapIn,
  ])
}
