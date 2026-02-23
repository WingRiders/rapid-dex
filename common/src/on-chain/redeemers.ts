import type {RefTxIn} from '@meshsdk/core'

export type SwapRedeemer = {
  swapAToB: boolean
  provided: number
}

export type AddLiquidityRedeemer = {
  aAdd: number
  bAdd: number
  xSwap: number
}

export const withdrawTypes = ['TO_BOTH', 'TO_A', 'TO_B'] as const
export type WithdrawType = (typeof withdrawTypes)[number]

export type WithdrawLiquidityRedeemer = {
  sharesAdd: number
  withdrawType: WithdrawType
}

export type WithdrawTreasuryRedeemer = Record<string, never>

export type DonateRedeemer = Record<string, never>

export type PoolRedeemer =
  | SwapRedeemer
  | AddLiquidityRedeemer
  | WithdrawLiquidityRedeemer
  | WithdrawTreasuryRedeemer
  | DonateRedeemer

export type MintRedeemer = {
  seedRef: RefTxIn
}
