import type {BuildAddLiquidityTxArgs} from '@/on-chain/transaction/add-liquidity'
import type {BuildCreatePoolTxArgs} from '@/on-chain/transaction/create-pool'
import type {BuildSwapTxArgs} from '@/on-chain/transaction/swap'
import type {BuildWithdrawLiquidityTxArgs} from '@/on-chain/transaction/withdraw-liquidity'
import type {PoolsListItem} from '@/types'
import type BigNumber from 'bignumber.js'
import type {Dictionary} from 'lodash'

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

  buildCreatePoolTx: (
    args: Omit<BuildCreatePoolTxArgs, 'wallet'> | undefined,
  ) => [...f.wallet(), 'build-create-pool-tx', args] as const,
  buildSwapTx: (args: Omit<BuildSwapTxArgs, 'wallet'> | undefined) =>
    [...f.wallet(), 'build-swap-tx', args] as const,
  buildAddLiquidityTx: (
    args: Omit<BuildAddLiquidityTxArgs, 'wallet'> | undefined,
  ) => [...f.wallet(), 'build-add-liquidity-tx', args] as const,
  buildWithdrawLiquidityTx: (
    args: Omit<BuildWithdrawLiquidityTxArgs, 'wallet'> | undefined,
  ) => [...f.wallet(), 'build-withdraw-liquidity-tx', args] as const,
}

export {f as queryKeyFactory}
