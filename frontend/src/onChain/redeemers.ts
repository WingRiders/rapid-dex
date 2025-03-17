import {
  type Data,
  mBool,
  mConStr0,
  mConStr1,
  mConStr2,
  mConStr3,
} from '@meshsdk/core'
import type {MintRedeemer, PoolRedeemer} from '@wingriders/rapid-dex-common'

export const poolRedeemerToMesh = (redeemer: PoolRedeemer): Data => {
  if ('swapAToB' in redeemer) {
    return mConStr0([mBool(redeemer.swapAToB), redeemer.provided])
  }
  if ('aAdd' in redeemer) {
    return mConStr1([redeemer.aAdd, redeemer.bAdd])
  }
  if ('sharesAdd' in redeemer) {
    return mConStr2([redeemer.sharesAdd])
  }
  return mConStr3([])
}

export const mintRedeemerToMesh = (redeemer: MintRedeemer) =>
  mConStr0([mConStr0([redeemer.seedRef.txHash, redeemer.seedRef.txIndex])])
