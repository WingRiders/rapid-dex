'use client'

import Link from 'next/link'
import {Button} from '../../components/ui/button'

const PoolsPage = () => {
  return (
    <div className="mx-auto mt-4 max-w-7xl">
      <div className="flex justify-between gap-2">
        <h2 className="font-bold text-2xl">Liquidity pools</h2>

        <Button asChild variant="secondary" size="lg">
          <Link href="/pools/create">Create new Pool</Link>
        </Button>
      </div>
    </div>
  )
}

export default PoolsPage
