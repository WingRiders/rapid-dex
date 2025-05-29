import type BigNumber from 'bignumber.js'
import {compareMaybeBigNumbers} from './numbers'

type SortPoolsItem = {
  tvlInAda: BigNumber | undefined
}
export const sortPools = (a: SortPoolsItem, b: SortPoolsItem) => {
  return -compareMaybeBigNumbers(a.tvlInAda, b.tvlInAda)
}
