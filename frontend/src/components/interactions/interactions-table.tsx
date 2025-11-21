import {SLOT_CONFIG_NETWORK, slotToBeginUnixTime} from '@meshsdk/core'
import {
  type ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table'
import type {Interaction} from '@wingriders/rapid-dex-common'
import {compact} from 'lodash'
import {ExternalLinkIcon, Loader2} from 'lucide-react'
import {useMemo, useState} from 'react'
import {env} from '@/config'
import {DEFAULT_PAGE_SIZE} from '@/constants'
import {CardanoscanLinks} from '@/helpers/explorer-links'
import {formatDateTime} from '@/helpers/format-date'
import {shortLabel} from '@/helpers/short-label'
import {DataTable} from '../ui/data-table'
import {UnitPairDisplay} from '../unit-pair-display'
import {InteractionEvent} from './interaction-event'
import {InteractionTypeDisplay} from './interaction-type-display'

type InteractionsTableProps = {
  interactions: Interaction[]
  hidePoolColumn?: boolean
}

export const InteractionsTable = ({
  interactions,
  hidePoolColumn,
}: InteractionsTableProps) => {
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  })

  const columns: ColumnDef<Interaction>[] = useMemo(() => {
    const explorerLinks = new CardanoscanLinks(env('NEXT_PUBLIC_NETWORK'))

    const columns: ColumnDef<Interaction>[] = compact([
      !hidePoolColumn && {
        header: 'Pool',
        cell: ({
          row: {
            original: {pool},
          },
        }) => <UnitPairDisplay unitA={pool.unitA} unitB={pool.unitB} />,
        meta: {
          width: '18%',
        },
      },
      {
        header: 'Type',
        cell: ({
          row: {
            original: {type},
          },
        }) => <InteractionTypeDisplay type={type} />,
        meta: {
          width: '10%',
        },
      },
      {
        header: 'Event',
        cell: ({row: {original: interaction}}) => (
          <InteractionEvent interaction={interaction} />
        ),
        meta: {
          width: '40%',
        },
      },
      {
        header: 'Confirmed at',
        cell: ({
          row: {
            original: {slot},
          },
        }) =>
          slot != null ? (
            formatDateTime(
              new Date(
                slotToBeginUnixTime(
                  slot,
                  SLOT_CONFIG_NETWORK[env('NEXT_PUBLIC_NETWORK')],
                ),
              ),
            )
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              <p>pending</p>
            </div>
          ),
        meta: {
          width: '17%',
        },
      },
      {
        header: 'Explorer',
        cell: ({
          row: {
            original: {txHash},
          },
        }) => (
          <a
            href={explorerLinks.transaction(txHash)}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 font-mono underline"
          >
            {shortLabel(txHash, 5, 5)}
            <ExternalLinkIcon className="size-4" />
          </a>
        ),
        meta: {
          width: '15%',
        },
      },
    ])

    return columns
  }, [hidePoolColumn])

  const table = useReactTable({
    data: interactions,
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
