import type {Unit} from '@meshsdk/core'
import {ChevronDownIcon} from 'lucide-react'
import {useState} from 'react'
import type {WalletBalanceState} from '@/wallet/queries'
import {cn} from '../../lib/utils'
import {UnitDisplay} from '../unit-display'
import type {AssetInputItem} from './types'
import {UnitSelectDialog} from './unit-select-dialog'

type UnitSelectProps = {
  items: AssetInputItem[] | null
  value: Unit | null
  onChange: (value: Unit | null) => void
  disabled?: boolean
  noItemsMessage?: string
  emptyItemsMessage?: string
  balanceState?: WalletBalanceState
}

export const UnitSelect = ({
  items,
  value,
  onChange,
  disabled,
  noItemsMessage,
  emptyItemsMessage,
  balanceState = 'has-data',
}: UnitSelectProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        className={cn(
          'min-h-[56px] min-w-[150px] rounded-md px-4 py-3',
          disabled ? 'cursor-default opacity-50' : 'hover:bg-gray-700',
        )}
        onClick={() => setIsDialogOpen(true)}
        disabled={disabled}
      >
        <div className="flex items-center justify-between gap-2">
          {value ? <UnitDisplay unit={value} /> : <p>Select asset</p>}
          <ChevronDownIcon className="h-4 w-4" />
        </div>
      </button>

      <UnitSelectDialog
        items={items}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onItemClick={(item) => {
          onChange(item.unit)
          setIsDialogOpen(false)
        }}
        noItemsMessage={noItemsMessage}
        emptyItemsMessage={emptyItemsMessage}
        balanceState={balanceState}
      />
    </>
  )
}
