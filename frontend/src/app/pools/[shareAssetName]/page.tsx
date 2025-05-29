'use client'

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
    <div className="mx-auto mt-4 max-w-7xl px-4">
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
    </div>
  )
}

export default PoolDetailsPage
