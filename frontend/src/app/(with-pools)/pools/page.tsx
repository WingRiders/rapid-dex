import {Button} from '@/components/ui/button'

import Link from 'next/link'
import {PoolsInfo} from './pools-info'
import {PoolsList} from './pools-list'

const PoolsPage = () => {
  return (
    <div className="mx-auto mt-4 max-w-7xl px-4">
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
    </div>
  )
}

export default PoolsPage
