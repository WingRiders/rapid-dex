import type {QueryClient} from '@tanstack/react-query'
import {sleep} from '@wingriders/rapid-dex-common'
import type {TRPC} from '@wingriders/rapid-dex-sdk-react'

// Give BE some time to update the mempool/db
const INVALIDATE_QUERY_AFTER_TX_SUBMISSION_DELAY = 1000

export const invalidateTotalTvlQuery = async (
  trpc: TRPC,
  queryClient: QueryClient,
) => {
  await sleep(INVALIDATE_QUERY_AFTER_TX_SUBMISSION_DELAY)
  queryClient.invalidateQueries({queryKey: trpc.tvl.queryKey()})
}

export const invalidateVolumeQueries = async (
  trpc: TRPC,
  queryClient: QueryClient,
) => {
  await sleep(INVALIDATE_QUERY_AFTER_TX_SUBMISSION_DELAY)
  queryClient.invalidateQueries({
    queryKey: trpc.poolsVolume.queryKey({hoursOffset: 24}),
  })
  queryClient.invalidateQueries({
    queryKey: trpc.volume.queryKey({hoursOffset: 24}),
  })
}

export const invalidateDailyActiveUsersQuery = async (
  trpc: TRPC,
  queryClient: QueryClient,
) => {
  await sleep(INVALIDATE_QUERY_AFTER_TX_SUBMISSION_DELAY)
  queryClient.invalidateQueries({queryKey: trpc.dailyActiveUsers.queryKey()})
}
