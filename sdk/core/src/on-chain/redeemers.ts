import {
  type Data,
  mBool,
  mConStr,
  mConStr0,
  mConStr1,
  mConStr2,
  mConStr3,
} from '@meshsdk/core'
import type {
  MintRedeemer,
  PoolRedeemer,
  WithdrawType,
} from '@wingriders/rapid-dex-common'

const withdrawTypeToConstr: Record<WithdrawType, number> = {
  TO_BOTH: 0,
  TO_A: 1,
  TO_B: 2,
}

export const poolRedeemerToMesh = (redeemer: PoolRedeemer): Data => {
  if ('swapAToB' in redeemer) {
    return mConStr0([mBool(redeemer.swapAToB), redeemer.provided])
  }
  if ('aAdd' in redeemer) {
    return mConStr1([redeemer.aAdd, redeemer.bAdd, redeemer.xSwap])
  }
  if ('sharesAdd' in redeemer) {
    return mConStr2([
      redeemer.sharesAdd,
      mConStr(withdrawTypeToConstr[redeemer.withdrawType], []),
    ])
  }
  return mConStr3([])
}

export const mintRedeemerToMesh = (redeemer: MintRedeemer) =>
  mConStr0([mConStr0([redeemer.seedRef.txHash, redeemer.seedRef.txIndex])])
