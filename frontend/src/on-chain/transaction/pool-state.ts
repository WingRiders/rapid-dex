import type {Asset} from '@meshsdk/core'
import {MeshValue} from '@meshsdk/core'
import {createUnit, poolValidatorHash} from '@wingriders/rapid-dex-common'
import {BigNumber} from 'bignumber.js'
import type {PoolsListItem} from '../../types'

type GetNewPoolAmountArgs = {
  pool: Pick<PoolsListItem, 'unitA' | 'unitB' | 'shareAssetName'> & {
    utxo: {output: {amount: Asset[]}}
  }
  lockA: BigNumber
  lockB: BigNumber
  lockShares?: BigNumber
}

export const getNewPoolAmount = ({
  pool,
  lockA,
  lockB,
  lockShares = new BigNumber(0),
}: GetNewPoolAmountArgs) => {
  const meshValue = MeshValue.fromAssets(pool.utxo.output.amount)
  meshValue.addAssets([
    {
      unit: pool.unitA,
      quantity: lockA.toString(),
    },
    {
      unit: pool.unitB,
      quantity: lockB.toString(),
    },
    {
      unit: createUnit(poolValidatorHash, pool.shareAssetName),
      quantity: lockShares.toString(),
    },
  ])
  return meshValue.toAssets()
}
