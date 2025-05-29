import {ErrorAlert} from '@/components/error-alert'
import {InteractionsTable} from '@/components/interactions/interactions-table'
import {useTRPC} from '@/trpc/client'
import {useQuery} from '@tanstack/react-query'
import {Loader2} from 'lucide-react'

type UserInteractionsTableProps = {
  stakeKeyHash: string
}

export const UserInteractionsTable = ({
  stakeKeyHash,
}: UserInteractionsTableProps) => {
  const trpc = useTRPC()

  const {
    data: interactions,
    isLoading,
    error,
  } = useQuery(
    trpc.userInteractions.queryOptions(
      {stakeKeyHash},
      {
        refetchOnMount: 'always',
      },
    ),
  )

  if (isLoading)
    return (
      <div className="flex min-h-60 items-center justify-center">
        <Loader2 className="size-8 animate-spin" />
      </div>
    )

  if (error)
    return (
      <ErrorAlert
        title="Error while fetching transactions"
        description={error.message}
      />
    )

  if (!interactions) return null

  return <InteractionsTable interactions={interactions} />
}
