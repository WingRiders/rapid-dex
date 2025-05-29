import type {TRPC} from '@/trpc/client'
import type {QueryClient} from '@tanstack/react-query'

// Give BE some time to update the mempool/db
const INVALIDATE_TOTAL_TVL_DELAY = 1000

export const invalidateTotalTvlQuery = async (
  trpc: TRPC,
  queryClient: QueryClient,
) => {
  await new Promise((resolve) =>
    setTimeout(resolve, INVALIDATE_TOTAL_TVL_DELAY),
  )
  queryClient.invalidateQueries({queryKey: trpc.tvl.queryKey()})
}
