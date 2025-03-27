import pluralize from 'pluralize'
import {useShallow} from 'zustand/shallow'
import {useLocalInteractionsStore} from '../store/local-interactions'
import {Tooltip, TooltipContent, TooltipTrigger} from './ui/tooltip'

const MAX_TXS_NUMBER_TO_SHOW = 9

export const UnconfirmedTxsCounter = () => {
  const unconfirmedInteractionsCount = useLocalInteractionsStore(
    useShallow((state) => state.unconfirmedInteractions.length),
  )

  if (unconfirmedInteractionsCount === 0) return null

  return (
    <Tooltip>
      <TooltipTrigger>
        <div className="flex h-8 w-8 animate-pulse items-center justify-center rounded-full bg-gray-700 p-1 text-white shadow-[0_0_15px_rgba(255,255,255,0.3)]">
          {unconfirmedInteractionsCount <= MAX_TXS_NUMBER_TO_SHOW
            ? unconfirmedInteractionsCount
            : `${MAX_TXS_NUMBER_TO_SHOW}+`}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        You have {unconfirmedInteractionsCount} unconfirmed{' '}
        {pluralize('transaction', unconfirmedInteractionsCount)}.
      </TooltipContent>
    </Tooltip>
  )
}
