import {CheckIcon, CopyIcon} from 'lucide-react'
import Image from 'next/image'
import {toast} from 'sonner'
import {useShallow} from 'zustand/shallow'
import {CardanoscanLinks} from '../helpers/explorer-links'
import {shortLabel} from '../helpers/short-label'
import {useConnectedWalletStore} from '../store/connected-wallet'
import {supportedWalletsInfo} from '../wallet/supported-wallets'
import {Button} from './ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  type DialogProps,
  DialogTitle,
} from './ui/dialog'
import {Tooltip, TooltipContent, TooltipTrigger} from './ui/tooltip'
import {WithClipboard} from './with-clipboard'

type AccountDialogProps = Pick<DialogProps, 'open' | 'onOpenChange'>

export const AccountDialog = ({open, onOpenChange}: AccountDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onOpenAutoFocus={(event) => {
          event.preventDefault()
        }}
      >
        <AccountDialogContent onOpenChange={onOpenChange} />
      </DialogContent>
    </Dialog>
  )
}

type AccountDialogContentProps = Pick<AccountDialogProps, 'onOpenChange'>

const AccountDialogContent = ({onOpenChange}: AccountDialogContentProps) => {
  const {connectedWallet, connectedWalletType, disconnectWallet} =
    useConnectedWalletStore(
      useShallow(
        ({connectedWallet, connectedWalletType, disconnectWallet}) => ({
          connectedWallet,
          connectedWalletType,
          disconnectWallet,
        }),
      ),
    )

  const handleDisconnect = () => {
    disconnectWallet()
    toast('Wallet disconnected.')
    onOpenChange?.(false)
  }

  if (!connectedWallet || !connectedWalletType) return null

  const explorerLinks = new CardanoscanLinks(connectedWallet.network)
  const connectedWalletInfo = supportedWalletsInfo[connectedWalletType]

  return (
    <DialogHeader>
      <DialogTitle>Account</DialogTitle>

      <div className="mt-2 flex items-center gap-2">
        <Image
          src={connectedWalletInfo.icon}
          alt={connectedWalletInfo.name}
          width={32}
          height={32}
        />
        <div className="flex flex-col">
          <Tooltip>
            <WithClipboard text={connectedWallet.address}>
              {({copy, isCopied}) => (
                <div className="flex items-center gap-2">
                  <TooltipTrigger>
                    <p
                      className="ml-4 text-gray-400 text-lg"
                      onClick={copy}
                      onKeyDown={copy}
                    >
                      {shortLabel(connectedWallet.address, 20, 10)}
                    </p>
                  </TooltipTrigger>

                  <Button variant="ghost" size="icon" onClick={copy}>
                    {isCopied ? (
                      <CheckIcon className="size-4" />
                    ) : (
                      <CopyIcon className="size-4" />
                    )}
                  </Button>
                </div>
              )}
            </WithClipboard>
            <TooltipContent>
              <p className="max-w-[300px] break-words">
                {connectedWallet.address}
              </p>
            </TooltipContent>
          </Tooltip>

          <div>
            <Button asChild variant="link">
              <a
                href={explorerLinks.address(connectedWallet.address)}
                target="_blank"
                rel="noopener noreferrer"
              >
                View on explorer
              </a>
            </Button>
          </div>
        </div>
      </div>

      <Button className="mt-2" variant="destructive" onClick={handleDisconnect}>
        Disconnect
      </Button>
    </DialogHeader>
  )
}
