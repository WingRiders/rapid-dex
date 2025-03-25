'use client'

import {
  type ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table'
import {ArrowDownUp} from 'lucide-react'
import Link from 'next/link'
import {useMemo, useState} from 'react'
import {getSwapUrl} from '../app/(with-pools)/swap/search-params'
import {DEFAULT_PAGE_SIZE} from '../constants'
import type {PoolsListItem} from '../types'
import {AssetQuantity} from './asset-quantity'
import {LiquidityManagementDialog} from './liquidity-management/liquidity-management-dialog'
import {PoolPrice} from './pool-price'
import {Button} from './ui/button'
import {DataTable} from './ui/data-table'
import {UnitPairDisplay} from './unit-pair-display'

type PoolsTableProps = {
  pools: PoolsListItem[]
}

export const PoolsTable = ({pools}: PoolsTableProps) => {
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  })

  const [liquidityManagementPool, setLiquidityManagementPool] =
    useState<PoolsListItem | null>(null)

  const columns: ColumnDef<PoolsListItem>[] = useMemo(
    () => [
      {
        header: 'Pool',
        cell: ({
          row: {
            original: {unitA, unitB},
          },
        }) => <UnitPairDisplay unitA={unitA} unitB={unitB} />,
      },
      {
        header: 'Price',
        cell: ({row: {original: pool}}) => (
          <p>
            <PoolPrice pool={pool} />
          </p>
        ),
      },
      {
        header: 'Asset A amount',
        cell: ({
          row: {
            original: {unitA, poolState},
          },
        }) => (
          <p>
            <AssetQuantity unit={unitA} quantity={poolState.qtyA} />
          </p>
        ),
      },
      {
        header: 'Asset B amount',
        cell: ({
          row: {
            original: {unitB, poolState},
          },
        }) => (
          <p>
            <AssetQuantity unit={unitB} quantity={poolState.qtyB} />
          </p>
        ),
      },
      {
        id: 'actions',
        cell: ({row: {original: pool}}) => (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="default"
              onClick={() => setLiquidityManagementPool(pool)}
            >
              Manage liquidity
            </Button>
            <Button variant="outline" size="icon" asChild>
              <Link
                href={getSwapUrl(pool.unitA, pool.unitB, pool.shareAssetName)}
              >
                <span className="sr-only">Swap</span>
                <ArrowDownUp />
              </Link>
            </Button>
          </div>
        ),
      },
    ],
    [],
  )

  const table = useReactTable({
    data: pools,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    state: {
      pagination,
    },
  })

  return (
    <>
      <DataTable table={table} />
      <LiquidityManagementDialog
        pool={liquidityManagementPool}
        onOpenChange={(open) => {
          if (!open) setLiquidityManagementPool(null)
        }}
      />
    </>
  )
}
