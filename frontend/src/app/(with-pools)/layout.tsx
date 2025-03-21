import {HydrateClient} from '@/components/hydrate-client'
import {prefetchTokensMetadata} from '@/metadata/queries'
import {getQueryClient, trpc} from '@/trpc/server'
import {isLovelaceUnit} from '@wingriders/rapid-dex-common'
import {uniq} from 'lodash'
import type {ReactNode} from 'react'

export const dynamic = 'force-dynamic'

const RootLayout = async ({
  children,
}: Readonly<{
  children: ReactNode
}>) => {
  const queryClient = getQueryClient()

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

  return <HydrateClient>{children}</HydrateClient>
}

export default RootLayout
