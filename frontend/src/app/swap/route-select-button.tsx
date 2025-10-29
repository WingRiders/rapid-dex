import {ChevronDownIcon} from 'lucide-react'
import {useState} from 'react'
import {computeFee} from '@/helpers/fee'
import {formatPercentage} from '@/helpers/format-percentage'
import {cn} from '@/lib/utils'
import {useTokenMetadata} from '@/metadata/queries'
import type {PoolsListItem} from '@/types'
import {RouteSelectDialog} from './route-select-dialog'
import type {AvailableRoute} from './swap-form'

type RouteSelectButtonProps = {
  availableRoutes: AvailableRoute[]
  selectedRouteIndex: number | null
  isSwapAToB: boolean
  onSelectedRouteChange: (shareAssetName: string) => void
  hasInputQuantities: boolean
  disabled?: boolean
}

export const RouteSelectButton = ({
  availableRoutes,
  selectedRouteIndex,
  isSwapAToB,
  onSelectedRouteChange,
  hasInputQuantities,
  disabled,
}: RouteSelectButtonProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const selectedPool =
    selectedRouteIndex != null
      ? availableRoutes?.[selectedRouteIndex]?.pool
      : undefined

  return (
    <>
      <button
        type="button"
        className={cn(
          'flex items-center gap-2',
          disabled ? 'cursor-default opacity-50' : 'hover:text-gray-300',
        )}
        onClick={() => setIsDialogOpen(true)}
        disabled={disabled}
      >
        {selectedPool ? (
          <SelectedPool pool={selectedPool} />
        ) : (
          <span>Liquidity pool</span>
        )}

        <ChevronDownIcon className="-mr-1" />
      </button>

      <RouteSelectDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        availableRoutes={availableRoutes}
        selectedRouteIndex={selectedRouteIndex}
        isSwapAToB={isSwapAToB}
        onSelectedRouteChange={onSelectedRouteChange}
        hasInputQuantities={hasInputQuantities}
      />
    </>
  )
}

type SelectedPoolProps = {
  pool: PoolsListItem
}

const SelectedPool = ({pool}: SelectedPoolProps) => {
  const {metadata: metadataA} = useTokenMetadata(pool.unitA)
  const {metadata: metadataB} = useTokenMetadata(pool.unitB)

  const assetATicker = metadataA?.ticker ?? metadataA?.name ?? 'unknown'
  const assetBTicker = metadataB?.ticker ?? metadataB?.name ?? 'unknown'

  const poolName = `${assetATicker}/${assetBTicker}`
  const swapFeePercentage = computeFee(pool.swapFeePoints, pool.feeBasis).times(
    100,
  )

  return (
    <p>
      {poolName} ({formatPercentage(swapFeePercentage)})
    </p>
  )
}
