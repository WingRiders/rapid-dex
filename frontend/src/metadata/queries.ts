import type {Unit} from '@meshsdk/core'
import {type QueryClient, skipToken, useQuery} from '@tanstack/react-query'
import type {TokenMetadata} from '@wingriders/rapid-dex-common'
import {decodeAssetName, decodeUnit, isAda} from '../helpers/asset'
import {type TRPC, useTRPC} from '../trpc'
import {ADA_METADATA} from './constants'

const getDefaultMetadata = (subject: Unit): TokenMetadata => {
  const [policyId, assetName] = decodeUnit(subject)
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
  if (isAda(unit)) return ADA_METADATA

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

export const prefetchTokensMetadata = async (
  units: Unit[],
  queryClient: QueryClient,
  trpc: TRPC,
) => {
  const unitsWithoutAda = units.filter((unit) => !isAda(unit))

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
      queryFn: () => opts.mutationFn?.(unitsWithoutAda),
    })
    unitsWithoutAda.forEach((unit) => {
      const metadata = tokensMetadata?.[unit]
      setMetadataQueryData(unit, metadata ?? null)
    })
  } catch (error) {
    console.error(error)

    unitsWithoutAda.forEach((unit) => {
      setMetadataQueryData(unit, null)
    })
  }
}

export const useTokenMetadata = (unit: Unit | null) => {
  const trpc = useTRPC()
  const {data, isLoading} = useQuery(
    trpc.tokenMetadata.queryOptions(unit ?? skipToken, {
      enabled: !!unit && !isAda(unit),
    }),
  )

  return {
    metadata:
      !unit || isLoading
        ? undefined
        : isAda(unit)
          ? ADA_METADATA
          : (data ?? getDefaultMetadata(unit)),
    hasRemoteMetadata: data != null,
    isLoading,
  }
}
