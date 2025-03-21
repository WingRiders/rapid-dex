'use client'

import {
  type ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table'
import {ArrowDownUp} from 'lucide-react'
import Link from 'next/link'
import {useState} from 'react'
import {getSwapUrl} from '../app/(with-pools)/swap/search-params'
import {DEFAULT_PAGE_SIZE} from '../constants'
import type {PoolsListItem} from '../types'
import {AssetQuantity} from './asset-quantity'
import {PoolPrice} from './pool-price'
import {Button} from './ui/button'
import {DataTable} from './ui/data-table'
import {UnitPairDisplay} from './unit-pair-display'

const columns: ColumnDef<PoolsListItem>[] = [
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
    cell: ({
      row: {
        original: {unitA, unitB, shareAssetName},
      },
    }) => (
      <div className="flex items-center gap-2">
        <Button variant="outline" size="default">
          Add liquidity
        </Button>
        <Button variant="outline" size="icon" asChild>
          <Link href={getSwapUrl(unitA, unitB, shareAssetName)}>
            <span className="sr-only">Swap</span>
            <ArrowDownUp />
          </Link>
        </Button>
      </div>
    ),
  },
]

type PoolsTableProps = {
  pools: PoolsListItem[]
}

export const PoolsTable = ({pools}: PoolsTableProps) => {
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  })

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

  return <DataTable table={table} />
}
