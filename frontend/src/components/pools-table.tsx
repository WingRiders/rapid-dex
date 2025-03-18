'use client'

import {
  type ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table'
import {ArrowDownUp} from 'lucide-react'
import {useState} from 'react'
import {DEFAULT_PAGE_SIZE} from '../constants'
import {createUnit} from '../helpers/asset'
import type {PoolsListItem} from '../types'
import {AssetQuantity} from './asset-quantity'
import {PoolPrice} from './pool-price'
import {Button} from './ui/button'
import {DataTable} from './ui/data-table'
import {UnitPairDisplay} from './unit-pair-display'

const columns: ColumnDef<PoolsListItem>[] = [
  {
    header: 'Pool',
    cell: ({row: {original: pool}}) => (
      <UnitPairDisplay
        unitA={createUnit(pool.assetAPolicy, pool.assetAName)}
        unitB={createUnit(pool.assetBPolicy, pool.assetBName)}
      />
    ),
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
    cell: ({row: {original: pool}}) => (
      <p>
        <AssetQuantity
          unit={createUnit(pool.assetAPolicy, pool.assetAName)}
          quantity={pool.qtyA}
        />
      </p>
    ),
  },
  {
    header: 'Asset B amount',
    cell: ({row: {original: pool}}) => (
      <p>
        <AssetQuantity
          unit={createUnit(pool.assetBPolicy, pool.assetBName)}
          quantity={pool.qtyB}
        />
      </p>
    ),
  },
  {
    id: 'actions',
    cell: () => (
      <div className="flex items-center gap-2">
        <Button variant="outline" size="default">
          Add liquidity
        </Button>
        <Button variant="outline" size="icon">
          <span className="sr-only">Swap</span>
          <ArrowDownUp />
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
