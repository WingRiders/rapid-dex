import type {Unit} from '@meshsdk/core'
import BigNumber from 'bignumber.js'
import {NumericFormat} from 'react-number-format'
import {DECIMAL_SEPARATOR, THOUSAND_SEPARATOR} from '../../constants'
import {useTokenMetadata} from '../../metadata/queries'
import {Input} from '../ui/input'

const MAX_VALUE = '1000000000000000000000'

type QuantityInputProps = {
  value: BigNumber | null
  onChange: (value: BigNumber | null) => void
  unit: Unit | null
  className?: string
  disabled?: boolean
}

export const QuantityInput = ({
  value,
  onChange,
  unit,
  className,
  disabled,
}: QuantityInputProps) => {
  const {metadata} = useTokenMetadata(unit)
  const decimalScale = metadata?.decimals ?? 0
  const stringValue = value?.shiftedBy(-decimalScale).toString() ?? ''

  return (
    <NumericFormat
      customInput={Input}
      className={className}
      thousandSeparator={THOUSAND_SEPARATOR}
      decimalSeparator={DECIMAL_SEPARATOR}
      allowedDecimalSeparators={['.', ',']}
      decimalScale={decimalScale}
      allowNegative={false}
      isAllowed={({value}) => !value || new BigNumber(value).lte(MAX_VALUE)}
      type="text"
      placeholder={Number(0).toFixed(decimalScale)}
      onValueChange={({value: newValue}, {source}) => {
        if (source === 'prop') return
        const parsedValue = new BigNumber(newValue)
        onChange(
          parsedValue.isNaN() ? null : parsedValue.shiftedBy(decimalScale),
        )
      }}
      value={stringValue}
      valueIsNumericString
      autoComplete="off"
      disabled={disabled}
    />
  )
}
