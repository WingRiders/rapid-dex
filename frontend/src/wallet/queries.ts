import {BrowserWallet} from '@meshsdk/core'
import {useQuery} from '@tanstack/react-query'

export const useInstalledWalletsIdsQuery = () =>
  useQuery({
    queryKey: ['installed-wallets-ids'],
    queryFn: async () => {
      const wallets = await BrowserWallet.getAvailableWallets()
      return new Set(wallets.map((wallet) => wallet.id))
    },
  })
