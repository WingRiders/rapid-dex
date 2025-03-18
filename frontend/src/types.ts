import type {useTRPC} from './trpc/client'

export type PoolsListItem = ReturnType<
  typeof useTRPC
>['pools']['~types']['output'][number]
