import {HydrateClient} from '@/components/hydrate-client'
import {LivePoolsUpdate} from '@/components/live-pools-update'
import {prefetchTokensMetadata} from '@/metadata/queries'
import {getQueryClient, getServerTrpc} from '@/trpc/server'
import {isLovelaceUnit} from '@wingriders/rapid-dex-common'
import {uniq} from 'lodash'
import type {ReactNode} from 'react'

type WithPoolsProps = {
  children?: ReactNode
}

export const WithPools = async ({children}: WithPoolsProps) => {
  const queryClient = getQueryClient()
  const trpc = getServerTrpc()

  try {
    const pools = await queryClient.fetchQuery(trpc.pools.queryOptions())

    const poolsUnits = uniq(
      pools.flatMap(({unitA, unitB}) => {
        return isLovelaceUnit(unitA) ? [unitB] : [unitA, unitB]
      }),
    )

    await prefetchTokensMetadata(poolsUnits, queryClient, trpc)
  } catch (error) {
    console.error(error)
  }

  return (
    <HydrateClient>
      {children}
      <LivePoolsUpdate />
    </HydrateClient>
  )
}
