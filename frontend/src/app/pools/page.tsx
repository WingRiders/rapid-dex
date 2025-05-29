import {Button} from '@/components/ui/button'

import {PageContainer} from '@/components/page-container'
import Link from 'next/link'
import {PoolsInfo} from './pools-info'
import {PoolsList} from './pools-list'

const PoolsPage = () => {
  return (
    <PageContainer>
      <div className="flex justify-between gap-2">
        <h2 className="font-bold text-2xl">Liquidity pools</h2>

        <Button asChild variant="secondary" size="lg">
          <Link href="/pools/create">Create new pool</Link>
        </Button>
      </div>

      <div className="mt-4">
        <PoolsInfo />
      </div>

      <div className="mt-4">
        <PoolsList />
      </div>
    </PageContainer>
  )
}

export default PoolsPage
