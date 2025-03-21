import {AssetQuantity} from '@/components/asset-quantity'
import {UnitPairDisplay} from '@/components/unit-pair-display'
import {computeFee} from '@/helpers/fee'
import {formatPercentage} from '@/helpers/format-percentage'
import {cn} from '@/lib/utils'
import type {PoolsListItem} from '@/types'
import type {ReactNode} from 'react'
import type {AvailableRoute} from './swap-form'

type RouteSelectItemProps = {
  pool: PoolsListItem
  swapQuantities: AvailableRoute['swapQuantities']
  isSwapAToB: boolean
  isSelected: boolean
  hasInputQuantities: boolean
  onClick: () => void
}

export const RouteSelectItem = ({
  pool,
  swapQuantities,
  isSwapAToB,
  isSelected,
  hasInputQuantities,
  onClick,
}: RouteSelectItemProps) => {
  const isRouteInvalid = swapQuantities == null && hasInputQuantities

  const [sellUnit, receiveUnit] = isSwapAToB
    ? [pool.unitA, pool.unitB]
    : [pool.unitB, pool.unitA]

  return (
    <button
      type="button"
      className={cn(
        'flex flex-col gap-2 rounded-md border border-input p-2 hover:bg-accent',
        isSelected && 'border-white bg-accent',
        isRouteInvalid ? 'bg-red-950 opacity-70 hover:bg-red-900' : '',
        isSelected && isRouteInvalid && 'border-red-500',
      )}
      onClick={onClick}
    >
      <UnitPairDisplay unitA={pool.unitA} unitB={pool.unitB} />

      <div className="flex flex-col items-start gap-2">
        <Row
          label="Pool reserves"
          value={
            <div className="flex flex-col items-end gap-1">
              <p className="text-right">
                <AssetQuantity
                  unit={pool.unitA}
                  quantity={pool.poolState.qtyA}
                />
              </p>
              <p className="text-right">
                <AssetQuantity
                  unit={pool.unitB}
                  quantity={pool.poolState.qtyB}
                />
              </p>
            </div>
          }
        />
        <Row
          label="Swap fee"
          value={formatPercentage(
            computeFee(pool.swapFeePoints, pool.feeBasis).times(100),
          )}
        />
        {swapQuantities && (
          <>
            <Row
              label="Sell"
              value={
                <AssetQuantity
                  unit={sellUnit}
                  quantity={swapQuantities.lockX}
                />
              }
            />
            <Row
              label="Receive"
              value={
                <AssetQuantity
                  unit={receiveUnit}
                  quantity={swapQuantities.outY}
                />
              }
            />
          </>
        )}
      </div>

      {isRouteInvalid && (
        <p className="text-red-200 text-sm ">
          This pool cannot satisfy the swap amount.
        </p>
      )}
    </button>
  )
}

type RowProps = {
  label: string
  value: ReactNode
}

const Row = ({label, value}: RowProps) => {
  return (
    <div className="flex w-full flex-row justify-between gap-2">
      <p className="text-muted-foreground text-sm">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  )
}
