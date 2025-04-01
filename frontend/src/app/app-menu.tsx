'use client'

import {ConnectWalletButton} from '@/components/connect-wallet/connect-wallet-button'
import {Badge} from '@/components/ui/badge'
import {UnconfirmedTxsCounter} from '@/components/unconfirmed-txs-counter'
import {env} from '@/config'
import Link from 'next/link'
import {usePathname} from 'next/navigation'
import {cn} from '../lib/utils'

export const AppMenu = () => {
  const network = env('NEXT_PUBLIC_NETWORK')

  return (
    <div className="flex items-center bg-gray-900 p-5">
      <div className="flex flex-row flex-wrap items-center gap-2">
        <h2 className="font-bold text-2xl">Rapid DEX</h2>
        <Badge>{network}</Badge>
      </div>

      <div className="mr-4 ml-10 flex flex-row items-center gap-8 lg:ml-28">
        <MenuItem label="Swap" href="/swap" />
        <MenuItem label="Pools" href="/pools" />
      </div>

      <div className="ml-auto flex flex-row items-center gap-5">
        <UnconfirmedTxsCounter />
        <ConnectWalletButton />
      </div>
    </div>
  )
}

type MenuItemProps = {
  label: string
  href: string
}

const MenuItem = ({label, href}: MenuItemProps) => {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <div
      className={cn(
        'font-bold text-gray-400 hover:text-gray-100',
        isActive && 'text-white',
      )}
    >
      <Link href={href} className="text-xl">
        {label}
      </Link>
    </div>
  )
}
