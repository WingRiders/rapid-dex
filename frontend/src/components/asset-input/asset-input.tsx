import type {WalletBalanceState} from '@/wallet/queries'
import {isLovelaceUnit} from '@wingriders/rapid-dex-common'
import BigNumber from 'bignumber.js'
import {WalletIcon} from 'lucide-react'
import {useMemo} from 'react'
import {AssetQuantity} from '../asset-quantity'
import {Button} from '../ui/button'
import {Skeleton} from '../ui/skeleton'
import {Tooltip, TooltipContent, TooltipTrigger} from '../ui/tooltip'
import {UnitDisplay} from '../unit-display'
import {QuantityInput} from './quantity-input'
import type {AssetInputItem, AssetInputValue} from './types'
import {UnitSelect} from './unit-select'

// buffer that is kept in the wallet to pay for tx fee
const LOVELACE_BUFFER = 2_000_000

export type AssetInputProps = {
  items: AssetInputItem[] | null
  value: AssetInputValue
  onChange: (value: AssetInputValue) => void
  disabled?: boolean
  singleItem?: boolean
  noItemsMessage?: string
  emptyItemsMessage?: string
  showMaxButton?: boolean
  balanceState?: WalletBalanceState
}

export const AssetInput = ({
  items,
  value,
  onChange,
  disabled,
  singleItem,
  noItemsMessage,
  emptyItemsMessage,
  showMaxButton,
  balanceState = 'has-data',
}: AssetInputProps) => {
  const selectedUnitBalance = useMemo(
    () =>
      value.unit
        ? items?.find((i) => i.unit === value.unit)?.balance
        : undefined,
    [items, value.unit],
  )

  const handleMaxButtonClick = () => {
    if (value.unit && selectedUnitBalance) {
      const maxQuantity = isLovelaceUnit(value.unit)
        ? BigNumber.max(selectedUnitBalance.minus(LOVELACE_BUFFER), 0)
        : selectedUnitBalance
      onChange({...value, quantity: maxQuantity})
    }
  }

  return (
    <div className="flex min-h-[104px] flex-col justify-center gap-1 rounded-md bg-gray-800 p-3">
      <div className="flex flex-row items-stretch gap-2">
        {singleItem ? (
          <div className="px-4 py-3">
            {value.unit ? <UnitDisplay unit={value.unit} /> : 'No asset'}
          </div>
        ) : (
          <UnitSelect
            items={items}
            value={value.unit}
            onChange={(unit) => onChange({...value, unit})}
            disabled={disabled}
            noItemsMessage={noItemsMessage}
            emptyItemsMessage={emptyItemsMessage}
            balanceState={balanceState}
          />
        )}

        <div className="flex-1">
          <QuantityInput
            value={value.quantity}
            onChange={(quantity) => onChange({...value, quantity})}
            unit={value.unit}
            className="h-full border-none bg-transparent text-right text-3xl"
            disabled={disabled}
          />
        </div>
      </div>

      {value.unit && (
        <div className="flex flex-row items-center justify-between pl-4">
          <Tooltip>
            <TooltipTrigger className="cursor-default">
              <div className="flex flex-row items-center gap-2 text-gray-400">
                <WalletIcon className="size-4" />

                {balanceState === 'loading' ? (
                  <Skeleton className="h-5 w-28" />
                ) : balanceState === 'has-data' ? (
                  <p className="text-sm">
                    <AssetQuantity
                      unit={value.unit}
                      quantity={selectedUnitBalance ?? new BigNumber(0)}
                      showTicker={false}
                    />
                  </p>
                ) : (
                  <p>-</p>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent>Your balance</TooltipContent>
          </Tooltip>
          {showMaxButton && balanceState === 'has-data' && (
            <Button
              variant="ghost"
              size="sm"
              className="h-fit"
              onClick={handleMaxButtonClick}
              disabled={disabled}
            >
              MAX
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
