import {Loader2} from 'lucide-react'
import Image from 'next/image'
import {cn} from '../../lib/utils'
import type {WalletInfo} from '../../wallet/supported-wallets'

type WalletItemProps = {
  walletInfo: WalletInfo
  onClick: () => void
  isInstalled: boolean
  isWalletConnecting: boolean
}

export const WalletItem = ({
  walletInfo,
  onClick,
  isInstalled,
  isWalletConnecting,
}: WalletItemProps) => {
  const disabled = !isInstalled || isWalletConnecting

  return (
    <button
      type="button"
      className={cn(
        'relative flex min-h-[68px] items-center justify-between rounded-md bg-gray-900 p-4',
        !disabled ? 'hover:bg-gray-800' : 'opacity-70',
      )}
      onClick={onClick}
      disabled={disabled}
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

      {isWalletConnecting && (
        <div className="absolute top-0 right-0 bottom-0 left-0 flex items-center justify-center">
          <Loader2 className="size-4 animate-spin" />
        </div>
      )}
    </button>
  )
}
