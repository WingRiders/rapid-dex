import type {Unit} from '@meshsdk/core'
import {type QueryClient, skipToken, useQuery} from '@tanstack/react-query'
import {
  isLovelaceUnit,
  parseUnit,
  type TokenMetadata,
} from '@wingriders/rapid-dex-common'
import {decodeAssetName} from '@wingriders/rapid-dex-sdk-core'
import {type TRPC, useTRPC} from '@wingriders/rapid-dex-sdk-react'
import {ADA_METADATA} from './constants'

const getDefaultMetadata = (unit: Unit): TokenMetadata => {
  const [policyId, assetName] = parseUnit(unit)
  const decodedAssetName = decodeAssetName(assetName)

  return {
    description: '',
    name: decodedAssetName,
    ticker: decodedAssetName.slice(0, 8),
    subject: `${policyId}${assetName}`,
  }
}

export const fetchTokenMetadata = async (
  unit: Unit,
  queryClient: QueryClient,
  trpc: TRPC,
) => {
  if (isLovelaceUnit(unit)) return ADA_METADATA

  try {
    const res = await queryClient.fetchQuery(
      trpc.tokenMetadata.queryOptions(unit),
    )
    return res ?? getDefaultMetadata(unit)
  } catch (error) {
    console.error(error)
    return getDefaultMetadata(unit)
  }
}

export const getTokenMetadataFromQueryCache = (
  unit: Unit,
  queryClient: QueryClient,
  trpc: TRPC,
) => {
  if (isLovelaceUnit(unit)) return ADA_METADATA

  const metadata = queryClient.getQueryData(trpc.tokenMetadata.queryKey(unit))
  return metadata ?? getDefaultMetadata(unit)
}

export const prefetchTokensMetadata = async (
  units: Unit[],
  queryClient: QueryClient,
  trpc: TRPC,
) => {
  const unitsToFetch = units.filter((unit) => {
    // no need to fetch metadata for ADA, it's hardcoded in the frontend
    if (isLovelaceUnit(unit)) return false

    // no need to fetch metadata for assets that already have metadata in the query cache
    const existingMetadata = queryClient.getQueryData(
      trpc.tokenMetadata.queryKey(unit),
    )
    // existingMetadata will be:
    // - null if it was fetched but there is no metadata for the asset
    // - undefined if it was not fetched yet
    if (existingMetadata !== undefined) {
      return false
    }

    return true
  })

  if (unitsToFetch.length === 0) return

  const setMetadataQueryData = (unit: Unit, metadata: TokenMetadata | null) => {
    const tokenMetadataOptions = trpc.tokenMetadata.queryOptions(unit)

    type TokenMetadataQueryData = ReturnType<
      Exclude<typeof tokenMetadataOptions.queryFn, undefined>
    >

    queryClient.setQueryData<TokenMetadataQueryData>(
      tokenMetadataOptions.queryKey,
      metadata,
    )
  }

  try {
    const opts = trpc.tokensMetadata.mutationOptions()
    const tokensMetadata = await queryClient.fetchQuery({
      queryKey: opts.mutationKey,
      queryFn: () => opts.mutationFn?.(unitsToFetch),
    })
    unitsToFetch.forEach((unit) => {
      const metadata = tokensMetadata?.[unit]
      setMetadataQueryData(unit, metadata ?? null)
    })
  } catch (error) {
    console.error(error)

    unitsToFetch.forEach((unit) => {
      setMetadataQueryData(unit, null)
    })
  }
}

export const useTokenMetadata = (unit: Unit | null) => {
  const trpc = useTRPC()
  const {data, isLoading} = useQuery(
    trpc.tokenMetadata.queryOptions(unit ?? skipToken, {
      enabled: !!unit && !isLovelaceUnit(unit),
    }),
  )

  return {
    metadata:
      !unit || isLoading
        ? undefined
        : isLovelaceUnit(unit)
          ? ADA_METADATA
          : (data ?? getDefaultMetadata(unit)),
    hasRemoteMetadata: data != null,
    isLoading,
  }
}
