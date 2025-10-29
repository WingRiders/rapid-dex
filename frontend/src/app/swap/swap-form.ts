import type {Unit} from '@meshsdk/core'
import {useQueryClient} from '@tanstack/react-query'
import {compareMaybeBigNumbers} from '@wingriders/rapid-dex-common'
import BigNumber from 'bignumber.js'
import {useCallback, useEffect, useMemo, useState} from 'react'
import {computeNewReserves} from '@/amm/swap'
import {EMPTY_ASSET_INPUT_VALUE} from '@/components/asset-input/constants'
import {isAssetInputValueNonEmpty} from '@/components/asset-input/helpers'
import type {AssetInputValue} from '@/components/asset-input/types'
import {matchPoolForUnits} from '@/helpers/pool'
import {transformQuantityToNewUnitDecimals} from '@/metadata/helpers'
import {useTokenMetadata} from '@/metadata/queries'
import {useConnectedWalletStore} from '@/store/connected-wallet'
import {useTRPC} from '@/trpc/client'
import type {PoolsListItem} from '@/types'
import {useWalletBalanceQuery} from '@/wallet/queries'
import {useSwapFormUrlValues} from './search-params'

export type AvailableRoute = {
  pool: PoolsListItem
  swapQuantities: {
    lockX: BigNumber
    outY: BigNumber
    paidSwapFee: BigNumber
  } | null
}

export type SwapFormValues = {
  from: AssetInputValue
  to: AssetInputValue
  shareAssetName: string | null
  availableRoutes: AvailableRoute[] | null
  isRouteForward: boolean | null
  isSelectedRouteLocked: boolean | null
}

const appendSwapQuantitiesToAvailableRoutes = (
  availableRoutes: AvailableRoute[],
  fromUnit: Unit,
  basedOn: {type: 'lockX' | 'outY'; value: BigNumber},
): AvailableRoute[] =>
  availableRoutes
    .map(({pool}) => {
      const [poolX, poolY] =
        fromUnit === pool.unitA
          ? [pool.poolState.qtyA, pool.poolState.qtyB]
          : [pool.poolState.qtyB, pool.poolState.qtyA]
      try {
        const {lockX, outY, newX, newY, paidSwapFee} = computeNewReserves({
          currentX: poolX,
          currentY: poolY,
          swapFeePoints: pool.swapFeePoints,
          feeBasis: pool.feeBasis,
          lockX: basedOn.type === 'lockX' ? basedOn.value : undefined,
          outY: basedOn.type === 'outY' ? basedOn.value : undefined,
        })

        return {
          pool,
          swapQuantities:
            newX.gt(0) && newY.gt(0) && lockX.gt(0) && outY.gt(0)
              ? {lockX, outY, paidSwapFee}
              : null,
        }
      } catch {
        return {
          pool,
          swapQuantities: null,
        }
      }
    })
    .sort((a, b) =>
      basedOn.type === 'lockX'
        ? compareMaybeBigNumbers(b.swapQuantities?.outY, a.swapQuantities?.outY)
        : -compareMaybeBigNumbers(
            a.swapQuantities?.lockX,
            b.swapQuantities?.lockX,
          ),
    )

const transformSwapValues = (
  values: SwapFormValues,
  trigger:
    | 'fromUnit'
    | 'fromQuantity'
    | 'toUnit'
    | 'toQuantity'
    | 'shareAssetName'
    | 'init'
    | 'pools',
  pools: PoolsListItem[] | undefined,
): SwapFormValues => {
  const transformedValues: SwapFormValues = values

  if (['fromUnit', 'toUnit', 'init', 'pools'].includes(trigger)) {
    if (values.from.unit && values.to.unit && pools) {
      const newAvailableRoutes = pools
        .filter(matchPoolForUnits(values.from.unit, values.to.unit))
        .map((pool) => ({pool, swapQuantities: null}))
      transformedValues.availableRoutes = newAvailableRoutes
      if (newAvailableRoutes.length === 0) {
        transformedValues.to.unit = null
        transformedValues.availableRoutes = null
      }
    } else transformedValues.availableRoutes = null

    if (!transformedValues.availableRoutes) return transformedValues

    if (values.isRouteForward) {
      if (!isAssetInputValueNonEmpty(values.from)) return transformedValues

      const newAvailableRoutes = appendSwapQuantitiesToAvailableRoutes(
        transformedValues.availableRoutes,
        values.from.unit,
        {type: 'lockX', value: values.from.quantity},
      )
      const selectedRoute =
        values.isSelectedRouteLocked && values.shareAssetName
          ? newAvailableRoutes.find(
              ({pool}) => pool.shareAssetName === values.shareAssetName,
            )
          : newAvailableRoutes[0]

      return {
        ...values,
        shareAssetName: selectedRoute?.pool.shareAssetName ?? null,
        to: {
          ...values.to,
          quantity: selectedRoute?.swapQuantities?.outY ?? null,
        },
        availableRoutes: newAvailableRoutes,
      }
    }

    if (!isAssetInputValueNonEmpty(values.to)) return transformedValues

    const newAvailableRoutes = appendSwapQuantitiesToAvailableRoutes(
      transformedValues.availableRoutes,
      values.to.unit,
      {type: 'outY', value: values.to.quantity},
    )
    const selectedRoute =
      values.isSelectedRouteLocked && values.shareAssetName
        ? newAvailableRoutes.find(
            ({pool}) => pool.shareAssetName === values.shareAssetName,
          )
        : (newAvailableRoutes.filter(
            ({swapQuantities}) => swapQuantities != null,
          )[0] ?? newAvailableRoutes[0])

    return {
      ...values,
      shareAssetName: selectedRoute?.pool.shareAssetName ?? null,
      from: {
        ...values.from,
        quantity: selectedRoute?.swapQuantities?.lockX ?? null,
      },
      availableRoutes: newAvailableRoutes,
    }
  }

  if (trigger === 'shareAssetName') {
    if (
      !values.availableRoutes ||
      !values.shareAssetName ||
      (!values.from.quantity && !values.to.quantity)
    )
      return values

    const route = values.availableRoutes.find(
      ({pool}) => pool.shareAssetName === values.shareAssetName,
    )

    if (!route) return values

    if (!route.swapQuantities)
      return {
        ...values,
        ...(values.isRouteForward
          ? {to: {...values.to, quantity: null}}
          : {from: {...values.from, quantity: null}}),
      }

    const {lockX, outY} = route.swapQuantities

    if (values.isRouteForward)
      return {
        ...values,
        to: {...values.to, quantity: outY},
      }
    return {
      ...values,
      from: {...values.from, quantity: lockX},
    }
  }

  if (['fromQuantity'].includes(trigger)) {
    if (!values.from.quantity?.gt(0))
      return {
        ...values,
        shareAssetName: values.isSelectedRouteLocked
          ? values.shareAssetName
          : null,
        to: {...values.to, quantity: null},
      }

    if (
      !transformedValues.availableRoutes ||
      !isAssetInputValueNonEmpty(values.from) ||
      !values.to.unit
    )
      return values
    const newAvailableRoutes = appendSwapQuantitiesToAvailableRoutes(
      transformedValues.availableRoutes,
      values.from.unit,
      {type: 'lockX', value: values.from.quantity},
    )
    const selectedRoute =
      values.isSelectedRouteLocked && values.shareAssetName
        ? newAvailableRoutes.find(
            ({pool}) => pool.shareAssetName === values.shareAssetName,
          )
        : newAvailableRoutes[0]

    return {
      ...values,
      to: {
        ...values.to,
        quantity: selectedRoute?.swapQuantities?.outY ?? null,
      },
      shareAssetName: selectedRoute?.pool.shareAssetName ?? null,
      availableRoutes: newAvailableRoutes,
    }
  }

  if (['toQuantity'].includes(trigger)) {
    if (!values.to.quantity?.gt(0))
      return {
        ...values,
        shareAssetName: values.isSelectedRouteLocked
          ? values.shareAssetName
          : null,
        from: {...values.from, quantity: null},
      }

    if (
      !transformedValues.availableRoutes ||
      !isAssetInputValueNonEmpty(values.to) ||
      !values.from.unit
    )
      return values
    const newAvailableRoutes = appendSwapQuantitiesToAvailableRoutes(
      transformedValues.availableRoutes,
      values.from.unit,
      {type: 'outY', value: values.to.quantity},
    )
    const selectedRoute =
      values.isSelectedRouteLocked && values.shareAssetName
        ? newAvailableRoutes.find(
            ({pool}) => pool.shareAssetName === values.shareAssetName,
          )
        : (newAvailableRoutes.filter(
            ({swapQuantities}) => swapQuantities != null,
          )[0] ?? newAvailableRoutes[0])

    return {
      ...values,
      shareAssetName: selectedRoute?.pool.shareAssetName ?? null,
      from: {
        ...values.from,
        quantity: selectedRoute?.swapQuantities?.lockX?.gt(0)
          ? selectedRoute.swapQuantities.lockX
          : null,
      },
      availableRoutes: newAvailableRoutes,
    }
  }

  return transformedValues
}

type UseSwapFormArgs = {
  pools: PoolsListItem[] | undefined
  swapUnits: Unit[] | undefined
  shareAssetNames: string[] | undefined
}

export const useSwapForm = ({
  pools,
  swapUnits,
  shareAssetNames,
}: UseSwapFormArgs) => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const {urlValues, setUrlValues} = useSwapFormUrlValues({
    swapUnits,
    shareAssetNames,
  })
  const [swapFormValues, setSwapFormValues] = useState<SwapFormValues>(
    transformSwapValues(
      {
        from: urlValues.fromUnit
          ? {unit: urlValues.fromUnit, quantity: null}
          : EMPTY_ASSET_INPUT_VALUE,
        to: urlValues.toUnit
          ? {unit: urlValues.toUnit, quantity: null}
          : EMPTY_ASSET_INPUT_VALUE,
        shareAssetName: urlValues.shareAssetName,
        availableRoutes: null,
        isRouteForward: null,
        isSelectedRouteLocked: urlValues.shareAssetName != null,
      },
      'init',
      pools,
    ),
  )

  // sync state values back to the URL
  useEffect(() => {
    setUrlValues({
      fromUnit: swapFormValues.from.unit,
      toUnit: swapFormValues.to.unit,
      shareAssetName: swapFormValues.shareAssetName,
    })
  }, [
    swapFormValues.from.unit,
    swapFormValues.to.unit,
    swapFormValues.shareAssetName,
    setUrlValues,
  ])

  // biome-ignore lint/correctness/useExhaustiveDependencies: we want to update the swap form values when the pools change
  useEffect(() => {
    if (pools) {
      setSwapFormValues(transformSwapValues(swapFormValues, 'pools', pools))
    }
  }, [pools])

  const onFromValueChange = useCallback(
    (
      valueOrGetValue:
        | AssetInputValue
        | ((current: AssetInputValue) => AssetInputValue),
    ) => {
      const value =
        typeof valueOrGetValue === 'function'
          ? valueOrGetValue(swapFormValues.from)
          : valueOrGetValue

      const trigger =
        value.unit === swapFormValues.from.unit ? 'fromQuantity' : 'fromUnit'

      if (value.quantity && value.unit !== swapFormValues.from.unit) {
        value.quantity = transformQuantityToNewUnitDecimals(
          value.quantity,
          swapFormValues.from.unit,
          value.unit,
          trpc,
          queryClient,
        )
      }
      const transformedValues = transformSwapValues(
        {
          ...swapFormValues,
          from: value,
          isRouteForward:
            trigger === 'fromQuantity' ? true : swapFormValues.isRouteForward,
        },
        trigger,
        pools,
      )

      setSwapFormValues(transformedValues)
    },
    [swapFormValues, pools, queryClient, trpc],
  )

  const onToValueChange = useCallback(
    (
      valueOrGetValue:
        | AssetInputValue
        | ((current: AssetInputValue) => AssetInputValue),
    ) => {
      const value =
        typeof valueOrGetValue === 'function'
          ? valueOrGetValue(swapFormValues.to)
          : valueOrGetValue

      const trigger =
        value.unit === swapFormValues.to.unit ? 'toQuantity' : 'toUnit'

      if (value.quantity && value.unit !== swapFormValues.to.unit) {
        value.quantity = transformQuantityToNewUnitDecimals(
          value.quantity,
          swapFormValues.to.unit,
          value.unit,
          trpc,
          queryClient,
        )
      }
      const transformedValues = transformSwapValues(
        {
          ...swapFormValues,
          to: value,
          isRouteForward:
            trigger === 'toQuantity' ? false : swapFormValues.isRouteForward,
        },
        trigger,
        pools,
      )
      setSwapFormValues(transformedValues)
    },
    [swapFormValues, pools, queryClient, trpc],
  )

  const onShareAssetNameChange = useCallback(
    (value: string) => {
      const transformedValues = transformSwapValues(
        {
          ...swapFormValues,
          shareAssetName: value,
          isSelectedRouteLocked: true,
        },
        'shareAssetName',
        pools,
      )
      setSwapFormValues(transformedValues)
    },
    [swapFormValues, pools],
  )

  const onFlipAssets = useCallback(() => {
    const transformedValues = transformSwapValues(
      {
        ...swapFormValues,
        from: swapFormValues.to,
        to: swapFormValues.from,
        isRouteForward: !swapFormValues.isRouteForward,
      },
      swapFormValues.isRouteForward ? 'toQuantity' : 'fromQuantity',
      pools,
    )
    setSwapFormValues(transformedValues)
  }, [swapFormValues, pools])

  const resetSwapForm = useCallback(() => {
    setSwapFormValues(
      transformSwapValues(
        {
          from: urlValues.fromUnit
            ? {unit: urlValues.fromUnit, quantity: null}
            : EMPTY_ASSET_INPUT_VALUE,
          to: urlValues.toUnit
            ? {unit: urlValues.toUnit, quantity: null}
            : EMPTY_ASSET_INPUT_VALUE,
          shareAssetName: urlValues.shareAssetName,
          availableRoutes: null,
          isRouteForward: null,
          isSelectedRouteLocked: swapFormValues.isRouteForward,
        },
        'init',
        pools,
      ),
    )
  }, [
    pools,
    urlValues.fromUnit,
    urlValues.toUnit,
    urlValues.shareAssetName,
    swapFormValues.isRouteForward,
  ])

  return {
    swapFormValues,
    onFromValueChange,
    onToValueChange,
    onShareAssetNameChange,
    onFlipAssets,
    resetSwapForm,
  }
}

type ValidateSwapFormParams = {
  values: SwapFormValues
}

export const useValidateSwapForm = ({
  values: {from, to},
}: ValidateSwapFormParams) => {
  const isWalletConnected = useConnectedWalletStore(
    (state) => state.connectedWallet != null,
  )
  const {data: balance} = useWalletBalanceQuery()

  const {metadata: fromUnitMetadata} = useTokenMetadata(from.unit)

  return useMemo<string | undefined>(() => {
    if (!isWalletConnected) return 'Connect your wallet'

    if (!from.unit || !to.unit) return 'Select assets'
    if (!from.quantity && !to.quantity) return 'Enter quantities'

    if (!from.quantity || !to.quantity)
      return 'Pool liquidity cannot satisfy the swap amount'

    const fromBalance = balance?.[from.unit] ?? new BigNumber(0)

    if (from.quantity?.gt(fromBalance))
      return fromUnitMetadata?.ticker
        ? `Insufficient balance of ${fromUnitMetadata.ticker}`
        : 'Insufficient balance'

    return undefined
  }, [
    balance,
    from.unit,
    from.quantity,
    fromUnitMetadata,
    to.unit,
    to.quantity,
    isWalletConnected,
  ])
}
