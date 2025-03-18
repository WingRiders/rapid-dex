import {CheckIcon, ExternalLinkIcon} from 'lucide-react'
import type {SetRequired} from 'type-fest'
import {CardanoscanLinks} from '../helpers/explorer-links'
import {useConnectedWalletStore} from '../store/connected-wallet'
import {Button} from './ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  type DialogProps,
  DialogTitle,
} from './ui/dialog'

type TxSubmittedDialogProps = Pick<DialogProps, 'onOpenChange'> & {
  txHash?: string
}

export const TxSubmittedDialog = ({
  onOpenChange,
  txHash,
}: TxSubmittedDialogProps) => {
  return (
    <Dialog open={!!txHash} onOpenChange={onOpenChange}>
      <DialogContent>
        {txHash && (
          <TxSubmittedDialogContent
            txHash={txHash}
            onOpenChange={onOpenChange}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

type TxSubmittedDialogContentProps = SetRequired<
  Pick<TxSubmittedDialogProps, 'txHash' | 'onOpenChange'>,
  'txHash'
>

const TxSubmittedDialogContent = ({
  txHash,
  onOpenChange,
}: TxSubmittedDialogContentProps) => {
  const network = useConnectedWalletStore(
    (state) => state.connectedWallet?.network,
  )
  if (!network) return null

  const explorerLinks = new CardanoscanLinks(network)

  return (
    <DialogHeader>
      <DialogTitle className="flex items-stretch gap-2 text-green-500">
        Transaction submitted <CheckIcon className="" />
      </DialogTitle>

      <div className="flex flex-col">
        <p>
          Your transaction was submitted on the Cardano blockchain. It may take
          a while until it's confirmed.
        </p>

        <Button asChild variant="secondary" className="mt-4">
          <a
            href={explorerLinks.transaction(txHash)}
            target="_blank"
            rel="noreferrer"
          >
            View on explorer
            <ExternalLinkIcon />
          </a>
        </Button>

        <Button onClick={() => onOpenChange?.(false)} className="mt-2">
          Close
        </Button>
      </div>
    </DialogHeader>
  )
}
