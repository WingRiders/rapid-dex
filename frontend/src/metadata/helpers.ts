import type {Unit} from '@meshsdk/core'
import type {QueryClient} from '@tanstack/react-query'
import type BigNumber from 'bignumber.js'
import type {TRPC} from '../trpc/client'
import {getTokenMetadataFromQueryCache} from './queries'

/**
 * Transforms a quantity from one unit to another, taking into account the decimals of the units.
 */
export const transformQuantityToNewUnitDecimals = (
  quantity: BigNumber,
  oldUnit: Unit,
  newUnit: Unit,
  trpc: TRPC,
  queryClient: QueryClient,
) => {
  const oldUnitDecimals =
    getTokenMetadataFromQueryCache(oldUnit, queryClient, trpc).decimals ?? 0
  const newUnitDecimals =
    getTokenMetadataFromQueryCache(newUnit, queryClient, trpc).decimals ?? 0
  const realQuantity = quantity.shiftedBy(-oldUnitDecimals)
  return realQuantity.shiftedBy(newUnitDecimals)
}
