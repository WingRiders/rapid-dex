import {UnitDisplay} from '../unit-display'
import {QuantityInput} from './quantity-input'
import type {AssetInputItem, AssetInputValue} from './types'
import {UnitSelect} from './unit-select'

export type AssetInputProps = {
  items: AssetInputItem[] | null
  value: AssetInputValue
  onChange: (value: AssetInputValue) => void
  disabled?: boolean
  singleItem?: boolean
  noItemsMessage?: string
  emptyItemsMessage?: string
}

export const AssetInput = ({
  items,
  value,
  onChange,
  disabled,
  singleItem,
  noItemsMessage,
  emptyItemsMessage,
}: AssetInputProps) => {
  return (
    <div className="flex flex-row items-stretch gap-2 rounded-md bg-gray-800 p-3">
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
  )
}
