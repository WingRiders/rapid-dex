import {computeFee} from '@/helpers/fee'
import {formatPercentage} from '@/helpers/format-percentage'
import {useTokenMetadata} from '@/metadata/queries'
import type {PoolsListItem} from '@/types'
import {useState} from 'react'
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
import {AddLiquidityContent} from './add-liquidity-content'

enum LiquidityManagementTab {
  ADD_LIQUIDITY = 'add-liquidity',
  WITHDRAW_LIQUIDITY = 'withdraw-liquidity',
}

type LiquidityManagementDialogProps = Pick<DialogProps, 'onOpenChange'> & {
  pool: PoolsListItem | null
}

export const LiquidityManagementDialog = ({
  onOpenChange,
  pool,
}: LiquidityManagementDialogProps) => {
  return (
    <Dialog open={!!pool} onOpenChange={onOpenChange}>
      <DialogContent onInteractOutside={(e) => e.preventDefault()}>
        {pool && <LiquidityManagementDialogContent pool={pool} />}
      </DialogContent>
    </Dialog>
  )
}

type LiquidityManagementDialogContentProps = {
  pool: PoolsListItem
}

const LiquidityManagementDialogContent = ({
  pool,
}: LiquidityManagementDialogContentProps) => {
  const [currentTab, setCurrentTab] = useState<LiquidityManagementTab>(
    LiquidityManagementTab.ADD_LIQUIDITY,
  )

  const {metadata: unitAMetadata} = useTokenMetadata(pool.unitA)
  const {metadata: unitBMetadata} = useTokenMetadata(pool.unitB)
  const unitATicker = unitAMetadata?.ticker ?? 'Unknown'
  const unitBTicker = unitBMetadata?.ticker ?? 'Unknown'

  const poolLabel = `${unitATicker} / ${unitBTicker}`

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
            <TabsTrigger value={LiquidityManagementTab.WITHDRAW_LIQUIDITY}>
              Withdraw liquidity
            </TabsTrigger>
          </TabsList>

          <TabsContent value={LiquidityManagementTab.ADD_LIQUIDITY}>
            <AddLiquidityContent pool={pool} />
          </TabsContent>
          <TabsContent value={LiquidityManagementTab.WITHDRAW_LIQUIDITY}>
            Withdraw liquidity
          </TabsContent>
        </Tabs>
      </div>
    </DialogHeader>
  )
}
