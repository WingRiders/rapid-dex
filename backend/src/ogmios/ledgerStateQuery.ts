import {createLedgerStateQueryClient} from '@cardano-ogmios/client'
import {getOgmiosContext, withClient} from './ogmios'

let ledgerStateQueryClient:
  | Awaited<ReturnType<typeof createLedgerStateQueryClient>>
  | undefined
const getLedgerStateQueryClient = async () => {
  // If the underlying socket connection has terminated recreate the client
  if (
    !ledgerStateQueryClient ||
    ledgerStateQueryClient.context.socket.readyState > 1
  ) {
    ledgerStateQueryClient = await createLedgerStateQueryClient(
      await getOgmiosContext(),
    )
  }
  return ledgerStateQueryClient
}

const queryClient = withClient(getLedgerStateQueryClient)

export const getNetworkTip = () => queryClient((q) => q.networkTip())

export const getLedgerTip = () => queryClient((q) => q.ledgerTip())
