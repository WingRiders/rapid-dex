'use client'

import {AssetQuantity} from '@/components/asset-quantity'
import {Skeleton} from '@/components/ui/skeleton'
import {Tooltip, TooltipContent, TooltipTrigger} from '@/components/ui/tooltip'
import {usePoolsQuery} from '@/helpers/pool'
import {useTRPC} from '@/trpc/client'
import {useQuery} from '@tanstack/react-query'
import {LOVELACE_UNIT} from '@wingriders/rapid-dex-common'
import {InfoIcon} from 'lucide-react'
import type {ReactNode} from 'react'

export const PoolsInfo = () => {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <TvlInfoItem />
      <VolumeInfoItem />
      <DailyActiveUsersInfoItem />
      <PoolsCountInfoItem />
    </div>
  )
}

const TvlInfoItem = () => {
  const trpc = useTRPC()
  const {data: tvl, isLoading} = useQuery(
    trpc.tvl.queryOptions(undefined, {refetchOnMount: true}),
  )

  return (
    <InfoItem
      label="TVL"
      value={
        tvl ? (
          <p>
            <AssetQuantity unit={LOVELACE_UNIT} quantity={tvl} />
          </p>
        ) : isLoading ? (
          <Skeleton className="h-6 w-full" />
        ) : (
          '-'
        )
      }
      tooltip="Total Value Locked (TVL) includes only pools that are either ADA pools or their assets have an ADA pool"
    />
  )
}

const VolumeInfoItem = () => {
  const trpc = useTRPC()
  const {data: volume, isLoading} = useQuery(
    trpc.volume.queryOptions({hoursOffset: 24}, {refetchOnMount: true}),
  )

  return (
    <InfoItem
      label="Volume 24h"
      value={
        volume ? (
          <p>
            <AssetQuantity unit={LOVELACE_UNIT} quantity={volume} />
          </p>
        ) : isLoading ? (
          <Skeleton className="h-6 w-full" />
        ) : (
          '-'
        )
      }
    />
  )
}

const DailyActiveUsersInfoItem = () => {
  const trpc = useTRPC()
  const {data: dailyActiveUsers, isLoading} = useQuery(
    trpc.dailyActiveUsers.queryOptions(undefined, {refetchOnMount: true}),
  )

  return (
    <InfoItem
      label="Daily active users"
      value={
        dailyActiveUsers != null ? (
          <p>{dailyActiveUsers}</p>
        ) : isLoading ? (
          <Skeleton className="h-6 w-full" />
        ) : (
          '-'
        )
      }
      tooltip="Number of unique addresses that have interacted with the DEX in the last 24 hours"
    />
  )
}

const PoolsCountInfoItem = () => {
  const {data: pools, isLoading} = usePoolsQuery()

  return (
    <InfoItem
      label="Pools"
      value={
        pools != null ? (
          <p>{pools.length}</p>
        ) : isLoading ? (
          <Skeleton className="h-6 w-full" />
        ) : (
          '-'
        )
      }
    />
  )
}

type InfoItemProps = {
  label: string
  value: ReactNode
  tooltip?: string
}

const InfoItem = ({label, value, tooltip}: InfoItemProps) => {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg bg-muted p-4">
      <div className="flex items-center gap-2 text-md text-muted-foreground">
        <p>{label}</p>
        {tooltip && (
          <Tooltip>
            <TooltipTrigger asChild>
              <InfoIcon className="h-4 w-4" />
            </TooltipTrigger>
            <TooltipContent>{tooltip}</TooltipContent>
          </Tooltip>
        )}
      </div>
      {value}
    </div>
  )
}
