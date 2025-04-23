import type {WalletBalanceState} from '@/wallet/queries'
import {useVirtualizer} from '@tanstack/react-virtual'
import {useRef} from 'react'
import {AssetQuantity} from '../asset-quantity'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  type DialogProps,
  DialogTitle,
} from '../ui/dialog'
import {Skeleton} from '../ui/skeleton'
import {UnitDisplay} from '../unit-display'
import type {AssetInputItem} from './types'

type UnitSelectDialogProps = {
  items: AssetInputItem[] | null
  onItemClick: (item: AssetInputItem) => void
  noItemsMessage?: string
  emptyItemsMessage?: string
  balanceState?: WalletBalanceState
} & Pick<DialogProps, 'open' | 'onOpenChange'>

export const UnitSelectDialog = ({
  items,
  open,
  onOpenChange,
  onItemClick,
  noItemsMessage,
  emptyItemsMessage,
  balanceState = 'has-data',
}: UnitSelectDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <UnitSelectDialogContent
          items={items}
          onItemClick={onItemClick}
          noItemsMessage={noItemsMessage}
          emptyItemsMessage={emptyItemsMessage}
          balanceState={balanceState}
        />
      </DialogContent>
    </Dialog>
  )
}

type UniSelectDialogContentProps = Pick<
  UnitSelectDialogProps,
  | 'items'
  | 'onItemClick'
  | 'noItemsMessage'
  | 'emptyItemsMessage'
  | 'balanceState'
>
const UnitSelectDialogContent = ({
  items,
  onItemClick,
  noItemsMessage,
  emptyItemsMessage,
  balanceState,
}: UniSelectDialogContentProps) => {
  const parentRef = useRef(null)

  const rowVirtualizer = useVirtualizer({
    count: items?.length ?? 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 55,
  })

  return (
    <DialogHeader>
      <DialogTitle>Select asset</DialogTitle>

      <div className="flex flex-row justify-between">
        <p className="text-gray-400">Asset</p>
        <p className="text-gray-400">Balance</p>
      </div>

      <div className="h-[70vh] overflow-auto" ref={parentRef}>
        {items && items.length > 0 ? (
          <div
            className="relative overflow-auto"
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualItem) => {
              const item = items[virtualItem.index]!
              const {unit, balance} = item

              return (
                <button
                  type="button"
                  key={virtualItem.key}
                  className="absolute top-0 left-0 flex w-full items-center justify-between gap-2 bg-gray-900 p-4 hover:bg-gray-800"
                  onClick={() => onItemClick(item)}
                  style={{
                    height: `${virtualItem.size}px`,
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                >
                  <UnitDisplay unit={unit} />
                  <p className="text-gray-300 text-sm">
                    {balanceState === 'loading' ? (
                      <Skeleton className="h-5 w-28" />
                    ) : balanceState === 'has-data' ? (
                      <AssetQuantity
                        unit={unit}
                        quantity={balance}
                        showTicker={false}
                      />
                    ) : (
                      '-'
                    )}
                  </p>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-center text-gray-400 ">
              {(items == null ? noItemsMessage : emptyItemsMessage) ??
                'No items'}
            </p>
          </div>
        )}
      </div>
    </DialogHeader>
  )
}
