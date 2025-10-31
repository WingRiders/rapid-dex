import type {
  BuildAddLiquidityTxArgs,
  BuildCreatePoolTxArgs,
  BuildSwapTxArgs,
  BuildWithdrawLiquidityTxArgs,
} from '@wingriders/rapid-dex-sdk-core'
import type BigNumber from 'bignumber.js'
import type {Dictionary} from 'lodash'
import type {PoolsListItem} from '@/types'

const f = {
  installedWalletsIds: () => ['installed-wallets-ids'] as const,

  wallet: () => ['wallet'] as const,
  walletBalance: () => [...f.wallet(), 'balance'] as const,
  walletUtxos: () => [...f.wallet(), 'utxos'] as const,
  signTx: () => [...f.wallet(), 'sign-tx'] as const,
  submitTx: () => [...f.wallet(), 'submit-tx'] as const,
  portfolio: (deps: {
    pools: PoolsListItem[] | undefined
    balance: Dictionary<BigNumber> | undefined
  }) => [...f.wallet(), 'portfolio', deps] as const,

  walletMutation: () => [...f.wallet(), 'mutation'] as const,
  buildCreatePoolTx: (
    args: Omit<BuildCreatePoolTxArgs, 'wallet'> | undefined,
  ) => [...f.walletMutation(), 'build-create-pool-tx', args] as const,
  buildSwapTx: (
    args: Omit<BuildSwapTxArgs, 'wallet' | 'walletUtxos'> | undefined,
  ) => [...f.walletMutation(), 'build-swap-tx', args] as const,
  buildAddLiquidityTx: (
    args: Omit<BuildAddLiquidityTxArgs, 'wallet'> | undefined,
  ) => [...f.walletMutation(), 'build-add-liquidity-tx', args] as const,
  buildWithdrawLiquidityTx: (
    args: Omit<BuildWithdrawLiquidityTxArgs, 'wallet'> | undefined,
  ) => [...f.walletMutation(), 'build-withdraw-liquidity-tx', args] as const,
}

export {f as queryKeyFactory}
