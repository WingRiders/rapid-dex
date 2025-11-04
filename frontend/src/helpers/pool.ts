import type {Unit} from '@meshsdk/core'
import type {PoolsListItem} from '../types'

export const matchPoolForUnits =
  (unitX: Unit, unitY: Unit) =>
  (pool: Pick<PoolsListItem, 'unitA' | 'unitB'>) =>
    (unitX === pool.unitA && unitY === pool.unitB) ||
    (unitX === pool.unitB && unitY === pool.unitA)
