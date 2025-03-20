import {HydrateClient} from '@/components/hydrate-client'
import {Button} from '@/components/ui/button'
import {getQueryClient, trpc} from '@/trpc/server'
import {isLovelaceUnit} from '@wingriders/rapid-dex-common'
import {uniq} from 'lodash'
import Link from 'next/link'
import {prefetchTokensMetadata} from '../../metadata/queries'
import {PoolsList} from './pools-list'

const PoolsPage = async () => {
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

  return (
    <HydrateClient>
      <div className="mx-auto mt-4 max-w-7xl px-4">
        <div className="flex justify-between gap-2">
          <h2 className="font-bold text-2xl">Liquidity pools</h2>

          <Button asChild variant="secondary" size="lg">
            <Link href="/pools/create">Create new Pool</Link>
          </Button>
        </div>

        <div className="mt-4">
          <PoolsList />
        </div>
      </div>
    </HydrateClient>
  )
}

export default PoolsPage
