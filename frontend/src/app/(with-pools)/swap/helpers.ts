import type {AssetInputItem} from '@/components/asset-input/types'
import type {PoolsListItem} from '@/types'
import type {WalletBalance} from '@/wallet/queries'
import type {Unit} from '@meshsdk/core'
import {parseUnit} from '@wingriders/rapid-dex-common'
import BigNumber from 'bignumber.js'
import {uniq} from 'lodash'
import {} from 'next/navigation'
import {} from 'react'

const isSwapUnitValid = (
  rawUnit: string | null,
  availableSwapUnits: Unit[],
) => {
  if (rawUnit == null) return true

  try {
    parseUnit(rawUnit)
  } catch {
    return false
  }

  return availableSwapUnits.includes(rawUnit)
}

export const toValidSwapUnit = (
  rawUnit: string | null,
  availableSwapUnits: Unit[],
): Unit | null =>
  isSwapUnitValid(rawUnit, availableSwapUnits) ? rawUnit : null

export const poolsToUnits = (
  pools: Pick<PoolsListItem, 'unitA' | 'unitB'>[],
): Unit[] => uniq(pools.flatMap<Unit>(({unitA, unitB}) => [unitA, unitB]))

export const matchPoolForSwapUnits =
  (fromUnit: Unit, toUnit: Unit) =>
  (pool: Pick<PoolsListItem, 'unitA' | 'unitB'>) =>
    (fromUnit === pool.unitA && toUnit === pool.unitB) ||
    (fromUnit === pool.unitB && toUnit === pool.unitA)

export const getSwapFormInputItems = (
  pools: PoolsListItem[],
  poolsUnits: Unit[],
  balance: WalletBalance,
  fromUnit: Unit | null,
): [fromItems: AssetInputItem[], toItems: AssetInputItem[]] => {
  const unitsToItems = (units: Unit[]): AssetInputItem[] =>
    units.map<AssetInputItem>((unit) => ({
      unit,
      balance: balance[unit] ?? new BigNumber(0),
    }))

  const allItems = unitsToItems(poolsUnits)

  // if fromUnit is not selected, allow users to select any unit in both `from` and `to`
  if (fromUnit == null) return [allItems, allItems]

  // otherwise, allow all units in `from` and only units that have a matching pool in `to`
  const toItems = unitsToItems(
    poolsToUnits(
      pools.filter(
        ({unitA, unitB}) => fromUnit === unitA || fromUnit === unitB,
      ),
    ).filter((unit) => unit !== fromUnit),
  )

  return [allItems, toItems]
}
