import {useQuery} from '@tanstack/react-query'
import {useTRPC} from '@wingriders/rapid-dex-sdk-react'
import Link from 'next/link'
import pluralize from 'pluralize'
import {Tooltip, TooltipContent, TooltipTrigger} from './ui/tooltip'

const MAX_TXS_NUMBER_TO_SHOW = 9

type UnconfirmedTxsCounterProps = {
  stakeKeyHash: string
}

export const UnconfirmedTxsCounter = ({
  stakeKeyHash,
}: UnconfirmedTxsCounterProps) => {
  const trpc = useTRPC()

  const {data: unconfirmedInteractions} = useQuery(
    trpc.userInteractions.queryOptions({
      stakeKeyHash,
      onlyUnconfirmed: true,
    }),
  )
  const unconfirmedInteractionsCount = unconfirmedInteractions?.length ?? 0

  if (unconfirmedInteractionsCount === 0) return null

  return (
    <Tooltip>
      <TooltipTrigger>
        <Link
          href="/transactions"
          className="flex h-8 w-8 animate-pulse items-center justify-center rounded-full bg-gray-700 p-1 text-white shadow-[0_0_15px_rgba(255,255,255,0.3)]"
        >
          {unconfirmedInteractionsCount <= MAX_TXS_NUMBER_TO_SHOW
            ? unconfirmedInteractionsCount
            : `${MAX_TXS_NUMBER_TO_SHOW}+`}
        </Link>
      </TooltipTrigger>
      <TooltipContent>
        You have {unconfirmedInteractionsCount} unconfirmed{' '}
        {pluralize('transaction', unconfirmedInteractionsCount)}.
      </TooltipContent>
    </Tooltip>
  )
}
