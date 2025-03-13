import {ConnectWalletButton} from '../components/connect-wallet/connect-wallet-button'

export const AppMenu = () => {
  return (
    <div className="flex items-center justify-between bg-gray-900 p-5">
      <h2 className="font-bold text-2xl">Rapid DEX</h2>
      <ConnectWalletButton />
    </div>
  )
}
