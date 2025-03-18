import BigNumber from 'bignumber.js'

import {DECIMAL_SEPARATOR, THOUSAND_SEPARATOR} from '../constants'

BigNumber.config({
  FORMAT: {
    decimalSeparator: DECIMAL_SEPARATOR,
    groupSeparator: THOUSAND_SEPARATOR,
    groupSize: 3,
  },
})

export type FormatNumberOptions = {
  prefix?: string
  suffix?: string
  minDecimals?: number
  maxDecimals?: number
} & (
  | {
      fixedDecimals?: undefined
    }
  | {
      maxDecimals: number // maximum number of decimals places in the formatted number
      fixedDecimals: boolean // if true, the formatted number will always have maxDecimals decimal places
    }
)

export const formatBigNumber = (
  number: BigNumber,
  options: FormatNumberOptions = {},
) => {
  let formattedNumber: string
  if (!number.isFinite()) {
    formattedNumber = number.toString()
  } else {
    const {maxDecimals, minDecimals, fixedDecimals} = options
    let formatDecimals: number | undefined
    if (maxDecimals != null || minDecimals != null)
      formatDecimals = fixedDecimals
        ? maxDecimals
        : Math.max(
            minDecimals ?? 0,
            Math.min(number.dp() ?? 0, maxDecimals ?? 0),
          )

    formattedNumber = number.toFormat(formatDecimals)
  }

  return `${options.prefix ?? ''}${formattedNumber}${options.suffix ?? ''}`
}
