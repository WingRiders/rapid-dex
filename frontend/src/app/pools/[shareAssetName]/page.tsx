'use client'

import {PageContainer} from '@/components/page-container'
import {Button} from '@/components/ui/button'
import {ArrowLeftIcon} from 'lucide-react'
import {useRouter} from 'next/navigation'
import {use} from 'react'
import {PoolInteractionsTable} from './pool-interactions-table'

const PoolDetailsPage = ({
  params: paramsPromise,
}: {params: Promise<{shareAssetName: string}>}) => {
  const params = use(paramsPromise)
  const router = useRouter()

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

      <div className="mt-6 flex flex-col gap-2">
        <h3 className="font-bold text-xl">Pool transactions</h3>
        <PoolInteractionsTable shareAssetName={params.shareAssetName} />
      </div>
    </PageContainer>
  )
}

export default PoolDetailsPage
