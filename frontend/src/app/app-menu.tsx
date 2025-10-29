'use client'

import {deserializeAddress} from '@meshsdk/core'
import Link from 'next/link'
import {usePathname} from 'next/navigation'
import {ConnectWalletButton} from '@/components/connect-wallet/connect-wallet-button'
import {Badge} from '@/components/ui/badge'
import {UnconfirmedTxsCounter} from '@/components/unconfirmed-txs-counter'
import {env} from '@/config'
import {useConnectedWalletStore} from '@/store/connected-wallet'
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
        <TransactionsItem />
        <ConnectWalletButton />
      </div>
    </div>
  )
}

type MenuItemProps = {
  label: string
  href: string
  linkClassName?: string
}

const MenuItem = ({label, href, linkClassName}: MenuItemProps) => {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <div
      className={cn(
        'font-bold text-gray-400 hover:text-gray-100',
        isActive && 'text-white',
      )}
    >
      <Link href={href} className={cn('text-xl', linkClassName)}>
        {label}
      </Link>
    </div>
  )
}

const TransactionsItem = () => {
  const connectedWallet = useConnectedWalletStore(
    (state) => state.connectedWallet,
  )

  if (!connectedWallet) return null

  const stakeKeyHash =
    deserializeAddress(connectedWallet.address).stakeCredentialHash || null

  return (
    <div className="flex flex-row items-center gap-4">
      {stakeKeyHash && <UnconfirmedTxsCounter stakeKeyHash={stakeKeyHash} />}
      <MenuItem
        label="Transactions"
        href="/transactions"
        linkClassName="text-lg"
      />
    </div>
  )
}
