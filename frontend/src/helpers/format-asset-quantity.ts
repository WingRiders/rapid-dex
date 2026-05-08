import type {TokenMetadata} from '@wingriders/rapid-dex-common'
import type BigNumber from 'bignumber.js'
import {getUnitTicker} from '@/metadata/helpers'
import {ADA_METADATA} from '../metadata/constants'
import {formatBigNumber} from './format-number'

export type FormatAssetQuantityOptions = {
  showTicker?: boolean
  showSymbol?: boolean // show symbol if available
  extraDecimals?: number // additional decimals to show while formatting
  fixedDecimals?: true
  maxDecimals?: number
  useNonBreakingSpace?: boolean
}

export const getAssetQuantityFormatter = (
  metadata: TokenMetadata | undefined,
) => {
  const ticker = getUnitTicker(metadata)
  const symbol = metadata?.symbol ?? ticker
  const decimals = metadata?.decimals ?? 0

  return (
    quantity: BigNumber,
    {
      showTicker = true,
      showSymbol,
      extraDecimals = 0,
      useNonBreakingSpace,
      fixedDecimals,
      maxDecimals,
    }: FormatAssetQuantityOptions = {},
  ) => {
    const realQuantity = quantity
      .shiftedBy(-decimals)
      .decimalPlaces(decimals + extraDecimals)
    const space = useNonBreakingSpace ? '\xa0' : ' '

    return `${formatBigNumber(realQuantity, {
      maxDecimals: maxDecimals ?? decimals + extraDecimals,
      fixedDecimals,
    })}${showTicker && ticker ? `${space}${ticker}` : ''}${showSymbol && symbol ? `${space}${symbol}` : ''}`
  }
}

export const formatAdaQuantity = getAssetQuantityFormatter(ADA_METADATA)
