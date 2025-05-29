import type {Unit} from '@meshsdk/core'
import {useRouter, useSearchParams} from 'next/navigation'
import {useCallback, useEffect, useMemo} from 'react'
import {toValidSwapUnit} from './helpers'

export const FROM_UNIT_SEARCH_PARAM = 'from' as const
export const TO_UNIT_SEARCH_PARAM = 'to' as const
export const SHARE_ASSET_NAME_SEARCH_PARAM = 'pool' as const

export const getSwapUrl = (
  fromUnit: Unit | null,
  toUnit: Unit | null,
  shareAssetName: string | null,
) => {
  const searchParams = new URLSearchParams({
    ...(fromUnit != null ? {[FROM_UNIT_SEARCH_PARAM]: fromUnit} : {}),
    ...(toUnit != null ? {[TO_UNIT_SEARCH_PARAM]: toUnit} : {}),
    ...(shareAssetName != null
      ? {[SHARE_ASSET_NAME_SEARCH_PARAM]: shareAssetName}
      : {}),
  })

  return `/swap?${searchParams.toString()}`
}

export type SwapFormUrlValues = {
  fromUnit: Unit | null
  toUnit: Unit | null
  shareAssetName: string | null
}

const setSwapSearchParamsValue = (
  searchParams: URLSearchParams,
  key:
    | typeof FROM_UNIT_SEARCH_PARAM
    | typeof TO_UNIT_SEARCH_PARAM
    | typeof SHARE_ASSET_NAME_SEARCH_PARAM,
  value: string | null,
) => {
  if (value == null) {
    searchParams.delete(key)
  } else {
    searchParams.set(key, value)
  }
}

type UseSwapFormUrlValuesArgs = {
  swapUnits: Unit[] | undefined
  shareAssetNames: string[] | undefined
}

export const useSwapFormUrlValues = ({
  swapUnits,
  shareAssetNames,
}: UseSwapFormUrlValuesArgs) => {
  const searchParams = useSearchParams()
  const router = useRouter()

  const fromUnitRaw = searchParams.get(FROM_UNIT_SEARCH_PARAM)
  const toUnitRaw = searchParams.get(TO_UNIT_SEARCH_PARAM)
  const shareAssetNameRaw = searchParams.get(SHARE_ASSET_NAME_SEARCH_PARAM)

  const fromUnit = useMemo(
    () => toValidSwapUnit(fromUnitRaw, swapUnits ?? []),
    [fromUnitRaw, swapUnits],
  )
  const toUnit = useMemo(
    () => toValidSwapUnit(toUnitRaw, swapUnits ?? []),
    [toUnitRaw, swapUnits],
  )
  const shareAssetName = useMemo(
    () =>
      shareAssetNameRaw && shareAssetNames?.includes(shareAssetNameRaw)
        ? shareAssetNameRaw
        : null,
    [shareAssetNameRaw, shareAssetNames],
  )

  const setUrlValues = useCallback(
    (newValues: SwapFormUrlValues) => {
      const newSearchParams = new URLSearchParams(searchParams)

      if (
        newValues.fromUnit !== undefined &&
        newValues.fromUnit !== searchParams.get(FROM_UNIT_SEARCH_PARAM)
      )
        setSwapSearchParamsValue(newSearchParams, 'from', newValues.fromUnit)
      if (
        newValues.toUnit !== undefined &&
        newValues.toUnit !== searchParams.get(TO_UNIT_SEARCH_PARAM)
      )
        setSwapSearchParamsValue(newSearchParams, 'to', newValues.toUnit)
      if (
        newValues.shareAssetName !== undefined &&
        newValues.shareAssetName !==
          searchParams.get(SHARE_ASSET_NAME_SEARCH_PARAM)
      )
        setSwapSearchParamsValue(
          newSearchParams,
          'pool',
          newValues.shareAssetName,
        )

      const newSearchParamsString = newSearchParams.toString()
      if (newSearchParamsString !== searchParams.toString())
        router.push(`/swap?${newSearchParamsString}`)
    },
    [searchParams, router],
  )

  // if the params are not valid, sync them back to the URL
  useEffect(() => {
    setUrlValues({fromUnit, toUnit, shareAssetName})
  }, [fromUnit, toUnit, shareAssetName, setUrlValues])

  const urlValues: SwapFormUrlValues = useMemo(
    () => ({
      fromUnit,
      toUnit,
      shareAssetName,
    }),
    [fromUnit, toUnit, shareAssetName],
  )

  return {
    urlValues,
    setUrlValues,
  }
}
