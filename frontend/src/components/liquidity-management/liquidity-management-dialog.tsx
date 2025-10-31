import {computeFee} from '@wingriders/rapid-dex-sdk-core'
import {useState} from 'react'
import {formatPercentage} from '@/helpers/format-percentage'
import type {PortfolioItem} from '@/helpers/portfolio'
import {useTokenMetadata} from '@/metadata/queries'
import type {PoolsListItem} from '@/types'
import {useConnectedWalletStore} from '../../store/connected-wallet'
import {AssetQuantity} from '../asset-quantity'
import {DataRows} from '../data-rows'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../ui/accordion'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  type DialogProps,
  DialogTitle,
} from '../ui/dialog'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '../ui/tabs'
import {Tooltip, TooltipContent, TooltipTrigger} from '../ui/tooltip'
import {AddLiquidityContent} from './add-liquidity-content'
import {WithdrawLiquidityContent} from './withdraw-liquidity-content'

enum LiquidityManagementTab {
  ADD_LIQUIDITY = 'add-liquidity',
  WITHDRAW_LIQUIDITY = 'withdraw-liquidity',
}

type LiquidityManagementDialogProps = Pick<DialogProps, 'onOpenChange'> & {
  pool: PoolsListItem | null
  portfolioItem?: PortfolioItem
}

export const LiquidityManagementDialog = ({
  onOpenChange,
  pool,
  portfolioItem,
}: LiquidityManagementDialogProps) => {
  return (
    <Dialog open={!!pool} onOpenChange={onOpenChange}>
      <DialogContent onInteractOutside={(e) => e.preventDefault()}>
        {pool && (
          <LiquidityManagementDialogContent
            pool={pool}
            portfolioItem={portfolioItem}
            onOpenChange={onOpenChange}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

type LiquidityManagementDialogContentProps = {
  pool: PoolsListItem
  portfolioItem?: PortfolioItem
  onOpenChange?: (open: boolean) => void
}

const LiquidityManagementDialogContent = ({
  pool,
  portfolioItem,
  onOpenChange,
}: LiquidityManagementDialogContentProps) => {
  const isWalletConnected = useConnectedWalletStore(
    (state) => state.connectedWallet != null,
  )

  const [currentTab, setCurrentTab] = useState<LiquidityManagementTab>(
    LiquidityManagementTab.ADD_LIQUIDITY,
  )

  const {metadata: unitAMetadata} = useTokenMetadata(pool.unitA)
  const {metadata: unitBMetadata} = useTokenMetadata(pool.unitB)
  const unitATicker = unitAMetadata?.ticker ?? 'Unknown'
  const unitBTicker = unitBMetadata?.ticker ?? 'Unknown'

  const poolLabel = `${unitATicker} / ${unitBTicker}`

  const isInPortfolio = portfolioItem != null

  const handleTxSubmittedModalClosed = () => {
    onOpenChange?.(false)
  }

  return (
    <DialogHeader>
      <DialogTitle>Manage your liquidity in {poolLabel}</DialogTitle>

      <Accordion type="single" collapsible>
        <AccordionItem value="pool-details">
          <AccordionTrigger className="py-1">Pool details</AccordionTrigger>
          <AccordionContent>
            <DataRows
              rows={[
                {
                  label: `${unitATicker} amount`,
                  value: (
                    <AssetQuantity
                      unit={pool.unitA}
                      quantity={pool.poolState.qtyA}
                    />
                  ),
                },
                {
                  label: `${unitBTicker} amount`,
                  value: (
                    <AssetQuantity
                      unit={pool.unitB}
                      quantity={pool.poolState.qtyB}
                    />
                  ),
                },
                {
                  label: 'Swap fee',
                  value: (
                    <p>
                      {formatPercentage(
                        computeFee(pool.swapFeePoints, pool.feeBasis).times(
                          100,
                        ),
                      )}
                    </p>
                  ),
                },
              ]}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="max-h-[80vh] overflow-y-auto overflow-x-hidden">
        <Tabs
          value={currentTab}
          onValueChange={(tab) => setCurrentTab(tab as LiquidityManagementTab)}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value={LiquidityManagementTab.ADD_LIQUIDITY}>
              Add liquidity
            </TabsTrigger>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center justify-center">
                  <TabsTrigger
                    value={LiquidityManagementTab.WITHDRAW_LIQUIDITY}
                    disabled={!isInPortfolio}
                  >
                    Withdraw liquidity
                  </TabsTrigger>
                </div>
              </TooltipTrigger>

              {(!isWalletConnected || !isInPortfolio) && (
                <TooltipContent>
                  {!isWalletConnected
                    ? 'Connect your wallet '
                    : "You don't have any liquidity in this pool."}
                </TooltipContent>
              )}
            </Tooltip>
          </TabsList>

          <TabsContent value={LiquidityManagementTab.ADD_LIQUIDITY}>
            <AddLiquidityContent
              pool={pool}
              onTxSubmittedModalClosed={handleTxSubmittedModalClosed}
            />
          </TabsContent>
          {isInPortfolio && (
            <TabsContent value={LiquidityManagementTab.WITHDRAW_LIQUIDITY}>
              <WithdrawLiquidityContent
                portfolioItem={portfolioItem}
                onTxSubmittedModalClosed={handleTxSubmittedModalClosed}
              />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </DialogHeader>
  )
}
