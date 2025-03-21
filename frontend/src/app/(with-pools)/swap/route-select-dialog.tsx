import {
  Dialog,
  DialogContent,
  DialogHeader,
  type DialogProps,
  DialogTitle,
} from '@/components/ui/dialog'
import {RouteSelectItem} from './route-select-item'
import type {AvailableRoute} from './swap-form'

type RouteSelectDialogProps = Pick<DialogProps, 'open' | 'onOpenChange'> & {
  availableRoutes: AvailableRoute[]
  selectedRouteIndex: number | null
  isSwapAToB: boolean
  onSelectedRouteChange: (shareAssetName: string) => void
  hasInputQuantities: boolean
}

export const RouteSelectDialog = ({
  open,
  onOpenChange,
  availableRoutes,
  selectedRouteIndex,
  isSwapAToB,
  onSelectedRouteChange,
  hasInputQuantities,
}: RouteSelectDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <RouteSelectDialogContent
          availableRoutes={availableRoutes}
          selectedRouteIndex={selectedRouteIndex}
          isSwapAToB={isSwapAToB}
          onSelectedRouteChange={onSelectedRouteChange}
          onOpenChange={onOpenChange}
          hasInputQuantities={hasInputQuantities}
        />
      </DialogContent>
    </Dialog>
  )
}

type RouteSelectDialogContentProps = Pick<
  RouteSelectDialogProps,
  | 'availableRoutes'
  | 'selectedRouteIndex'
  | 'isSwapAToB'
  | 'onSelectedRouteChange'
  | 'onOpenChange'
  | 'hasInputQuantities'
>

const RouteSelectDialogContent = ({
  availableRoutes,
  selectedRouteIndex,
  isSwapAToB,
  onSelectedRouteChange,
  onOpenChange,
  hasInputQuantities,
}: RouteSelectDialogContentProps) => {
  return (
    <DialogHeader>
      <DialogTitle>Select liquidity pool</DialogTitle>

      <div className="flex max-h-[80vh] flex-col gap-2 overflow-y-auto">
        {availableRoutes.map(({pool, swapQuantities}, index) => {
          return (
            <RouteSelectItem
              key={pool.shareAssetName}
              pool={pool}
              swapQuantities={swapQuantities}
              isSwapAToB={isSwapAToB}
              isSelected={selectedRouteIndex === index}
              hasInputQuantities={hasInputQuantities}
              onClick={() => {
                onSelectedRouteChange(pool.shareAssetName)
                onOpenChange?.(false)
              }}
            />
          )
        })}
      </div>
    </DialogHeader>
  )
}
