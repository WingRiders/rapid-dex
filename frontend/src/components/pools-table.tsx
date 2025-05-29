'use client'

import {
  type ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table'
import {LOVELACE_UNIT} from '@wingriders/rapid-dex-common'
import type {Dictionary} from 'lodash'
import {ArrowDownUp} from 'lucide-react'
import Link from 'next/link'
import {useMemo, useState} from 'react'
import {getSwapUrl} from '../app/(with-pools)/swap/search-params'
import {DEFAULT_PAGE_SIZE} from '../constants'
import type {PortfolioItem} from '../helpers/portfolio'
import type {PoolsListItem} from '../types'
import {AssetQuantity} from './asset-quantity'
import {LiquidityManagementDialog} from './liquidity-management/liquidity-management-dialog'
import {PoolPrice} from './pool-price'
import {Button} from './ui/button'
import {DataTable} from './ui/data-table'
import {UnitPairDisplay} from './unit-pair-display'

type PoolsTableProps = {
  pools: PoolsListItem[]
  portfolioItems?: Dictionary<PortfolioItem>
}

type PoolsTableMeta = {
  portfolioItems?: Dictionary<PortfolioItem>
}

export const PoolsTable = ({pools, portfolioItems}: PoolsTableProps) => {
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
            original: {unitA, unitB, shareAssetName},
          },
        }) => (
          <Link href={`/pools/${shareAssetName}`}>
            <UnitPairDisplay unitA={unitA} unitB={unitB} />
          </Link>
        ),
      },
      {
        header: 'TVL',
        cell: ({
          row: {
            original: {tvlInAda},
          },
        }) => (
          <p>
            {tvlInAda ? (
              <AssetQuantity unit={LOVELACE_UNIT} quantity={tvlInAda} />
            ) : (
              '-'
            )}
          </p>
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
        cell: ({row: {original: pool}, table}) => {
          const {portfolioItems} = table.options.meta as PoolsTableMeta
          const portfolioItem = portfolioItems?.[pool.shareAssetName]
          const isInPortfolio = portfolioItem != null

          return (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="default"
                onClick={() => setLiquidityManagementPool(pool)}
              >
                {isInPortfolio ? 'Manage liquidity' : 'Add liquidity'}{' '}
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
          )
        },
      },
    ],
    [],
  )

  const meta = useMemo<PoolsTableMeta>(
    () => ({
      portfolioItems,
    }),
    [portfolioItems],
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
    meta,
  })

  return (
    <>
      <DataTable table={table} />
      <LiquidityManagementDialog
        pool={liquidityManagementPool}
        portfolioItem={
          liquidityManagementPool
            ? portfolioItems?.[liquidityManagementPool.shareAssetName]
            : undefined
        }
        onOpenChange={(open) => {
          if (!open) setLiquidityManagementPool(null)
        }}
      />
    </>
  )
}
