import {MeshValue} from '@meshsdk/common'
import type {Asset, UTxO} from '@meshsdk/core'
import {
  type SupportedNetwork,
  poolScriptAddressByNetwork,
} from '@wingriders/rapid-dex-common'
import {BigNumber} from 'bignumber.js'

type PoolUnits = {
  aTokenUnit: string
  bTokenUnit: string
  shareUnit: string
}

// Corresponds to PoolOutput prisma model
// Can be replaced with tRPC type once client is implemented
export type PoolState = {
  utxoId: string
  poolUnits: PoolUnits
  assets: Asset[]
  qtyA: BigNumber
  qtyB: BigNumber
  qtyShares: BigNumber
  coins: BigNumber
  datumCbor: string
  swapFeePoints: number
  feeBasis: number
}

export const poolStateToUtxo = (
  network: SupportedNetwork,
  poolState: PoolState,
): UTxO => {
  const [txHash, outputIndex] = poolState.utxoId.split('#')
  return {
    input: {txHash, outputIndex: Number(outputIndex)},
    output: {
      address: poolScriptAddressByNetwork[network],
      amount: poolState.assets,
      plutusData: poolState.datumCbor,
    },
  }
}

type GetNewPoolAmountArgs = {
  poolState: PoolState
  lockA: BigNumber
  lockB: BigNumber
  lockShares?: BigNumber
}

export const getNewPoolAmount = ({
  poolState,
  lockA,
  lockB,
  lockShares = new BigNumber(0),
}: GetNewPoolAmountArgs) => {
  const meshValue = MeshValue.fromAssets(poolState.assets)
  meshValue.addAssets([
    {
      unit: poolState.poolUnits.aTokenUnit,
      quantity: lockA.toString(),
    },
    {
      unit: poolState.poolUnits.bTokenUnit,
      quantity: lockB.toString(),
    },
    {
      unit: poolState.poolUnits.shareUnit,
      quantity: lockShares.toString(),
    },
  ])
  return meshValue.toAssets()
}
