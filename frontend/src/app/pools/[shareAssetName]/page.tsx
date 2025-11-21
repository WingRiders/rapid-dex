'use client'

import {usePoolsQuery} from '@wingriders/rapid-dex-sdk-react'
import {ArrowLeftIcon, Loader2} from 'lucide-react'
import {useRouter} from 'next/navigation'
import {use, useMemo} from 'react'
import {ErrorAlert} from '@/components/error-alert'
import {PageContainer} from '@/components/page-container'
import {SwapFeeDisplay} from '@/components/swap-fee-display'
import {Button} from '@/components/ui/button'
import {UnitPairDisplay} from '@/components/unit-pair-display'
import {PoolInteractionsTable} from './pool-interactions-table'

const PoolDetailsPage = ({
  params: paramsPromise,
}: {
  params: Promise<{shareAssetName: string}>
}) => {
  const params = use(paramsPromise)
  const router = useRouter()

  const {data: pools, isLoading, isError} = usePoolsQuery()

  const pool = useMemo(
    () => pools?.find((pool) => pool.shareAssetName === params.shareAssetName),
    [pools, params.shareAssetName],
  )

  return (
    <PageContainer>
      <div className="flex flex-row flex-wrap items-center gap-3">
        <Button
          variant="outline"
          onClick={() => router.push('/pools')}
          size="sm"
        >
          <ArrowLeftIcon />
          Pools
        </Button>
        <h2 className="font-bold text-2xl">Liquidity pool</h2>
      </div>

      {pool ? (
        <div className="mt-6">
          <div className="flex flex-row items-center justify-between gap-2">
            <UnitPairDisplay unitA={pool.unitA} unitB={pool.unitB} />

            <div className="flex flex-row items-center gap-2">
              <p>
                Swap fee:{' '}
                <SwapFeeDisplay
                  swapFeePointsAToB={pool.swapFeePointsAToB}
                  swapFeePointsBToA={pool.swapFeePointsBToA}
                  feeBasis={pool.feeBasis}
                  feeFrom={pool.feeFrom}
                  unitA={pool.unitA}
                  unitB={pool.unitB}
                />
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2">
            <h3 className="font-bold text-xl">Pool transactions</h3>
            <PoolInteractionsTable shareAssetName={params.shareAssetName} />
          </div>
        </div>
      ) : isLoading ? (
        <div className="flex min-h-60 items-center justify-center">
          <Loader2 className="size-8 animate-spin" />
        </div>
      ) : isError ? (
        <ErrorAlert
          title="Error while fetching liquidity pool"
          className="mt-6"
        />
      ) : (
        <ErrorAlert title="Liquidity pool not found" className="mt-6" />
      )}
    </PageContainer>
  )
}

export default PoolDetailsPage
