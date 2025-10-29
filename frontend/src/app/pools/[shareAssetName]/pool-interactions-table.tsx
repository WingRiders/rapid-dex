import {Loader2} from 'lucide-react'
import {ErrorAlert} from '@/components/error-alert'
import {InteractionsTable} from '@/components/interactions/interactions-table'
import {useLivePoolInteractionsQuery} from '@/helpers/pool'

type PoolInteractionsTableProps = {
  shareAssetName: string
}

export const PoolInteractionsTable = ({
  shareAssetName,
}: PoolInteractionsTableProps) => {
  const {
    data: interactions,
    isLoading,
    error,
  } = useLivePoolInteractionsQuery({shareAssetName})

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
