export type SwapRedeemer = {
  swapAToB: boolean
  provided: number
}

export type AddLiquidityRedeemer = {
  aAdd: number
  bAdd: number
}

export type WithdrawLiquidityRedeemer = {
  sharesAdd: number
}

export type DonateRedeemer = Record<string, never>

export type PoolRedeemer =
  | SwapRedeemer
  | AddLiquidityRedeemer
  | WithdrawLiquidityRedeemer
  | DonateRedeemer
