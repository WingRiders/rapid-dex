import {computeEarnedShares} from '@/amm/add-liquidity'
import {getPoolState, initContext, signAndSubmitTx} from '@/cli/common'
import {buildAddLiquidityTx} from '@/onChain/transaction/add-liquidity'
import type {NetworkId} from '@wingriders/rapid-dex-common'
import BigNumber from 'bignumber.js'

type AddLiquidityParams = {
  blockfrostProjectId: string
  networkId: NetworkId
  mnemonic: string
  shareAssetName: string
  quantityA: number
  quantityB: number
}

export const addLiquidity = async ({
  blockfrostProjectId,
  networkId,
  mnemonic,
  shareAssetName,
  quantityA,
  quantityB,
}: AddLiquidityParams) => {
  const {blockchainProvider, wallet} = await initContext({
    blockfrostProjectId,
    networkId,
    mnemonic,
  })

  const poolState = await getPoolState({
    networkId,
    shareAssetName,
    fetcher: blockchainProvider,
  })

  const lockA = new BigNumber(quantityA)
  const lockB = new BigNumber(quantityB)

  const earnedShares = computeEarnedShares({
    lockA,
    lockB,
    currentA: poolState.qtyA,
    currentB: poolState.qtyB,
    currentShares: poolState.qtyShares,
  })
  console.info(`Building transaction with earnedShares = ${earnedShares}`)

  const {builtTx, txFee} = await buildAddLiquidityTx({
    wallet,
    fetcher: blockchainProvider,
    poolState,
    lockA,
    lockB,
    earnedShares,
  })

  await signAndSubmitTx({builtTx, txFee, wallet})
}
