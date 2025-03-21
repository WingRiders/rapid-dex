import type BigNumber from 'bignumber.js'
import {formatBigNumber} from './format-number'

export const formatPercentage = (percentage: BigNumber) =>
  formatBigNumber(percentage, {suffix: '%'})
