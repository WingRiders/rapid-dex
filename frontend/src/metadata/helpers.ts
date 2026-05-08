import type {Unit} from '@meshsdk/core'
import type {QueryClient} from '@tanstack/react-query'
import type {TokenMetadata} from '@wingriders/rapid-dex-common'
import type {TRPC} from '@wingriders/rapid-dex-sdk-react'
import type BigNumber from 'bignumber.js'
import {getTokenMetadataFromQueryCache} from './queries'

/**
 * Transforms a quantity from one unit to another, taking into account the decimals of the units.
 */
export const transformQuantityToNewUnitDecimals = (
  quantity: BigNumber,
  oldUnit: Unit | null,
  newUnit: Unit | null,
  trpc: TRPC,
  queryClient: QueryClient,
) => {
  const oldUnitDecimals = oldUnit
    ? (getTokenMetadataFromQueryCache(oldUnit, queryClient, trpc).decimals ?? 0)
    : 0
  const newUnitDecimals = newUnit
    ? (getTokenMetadataFromQueryCache(newUnit, queryClient, trpc).decimals ?? 0)
    : 0
  const realQuantity = quantity.shiftedBy(-oldUnitDecimals)
  return realQuantity.shiftedBy(newUnitDecimals)
}

export function getUnitTicker(
  metadata: Pick<TokenMetadata, 'ticker' | 'name'>,
): string
export function getUnitTicker(
  metadata: Pick<TokenMetadata, 'ticker' | 'name'> | undefined,
): string | undefined
export function getUnitTicker(
  metadata: Pick<TokenMetadata, 'ticker' | 'name'> | undefined,
): string | undefined {
  return metadata?.ticker ?? metadata?.name
}
