import Image from 'next/image'
import {cn} from '../../lib/utils'
import type {WalletInfo} from '../../wallet/supported-wallets'

type WalletItemProps = {
  walletInfo: WalletInfo
  onClick: () => void
  isInstalled: boolean
}

export const WalletItem = ({
  walletInfo,
  onClick,
  isInstalled,
}: WalletItemProps) => {
  return (
    <button
      type="button"
      className={cn(
        'flex min-h-[68px] items-center justify-between rounded-md bg-gray-900 p-4',
        isInstalled ? 'hover:bg-gray-800' : 'opacity-70',
      )}
      onClick={onClick}
      disabled={!isInstalled}
    >
      <div className="flex items-center gap-2">
        <Image
          src={walletInfo.icon}
          alt={walletInfo.name}
          width={32}
          height={32}
        />
        {walletInfo.name}
      </div>
      {!isInstalled && <p className="text-gray-400 text-sm">Not installed</p>}
    </button>
  )
}
