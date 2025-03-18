import {computeNewReserves} from '@/amm/swap'
import {getPoolState, initContext, signAndSubmitTx} from '@/cli/common'
import {buildSwapTx} from '@/onChain/transaction/swap'
import type {NetworkId} from '@wingriders/rapid-dex-common'
import BigNumber from 'bignumber.js'

type SwapParams = {
  blockfrostProjectId: string
  networkId: NetworkId
  mnemonic: string
  shareAssetName: string
  quantityX: number
  direction: 'aToB' | 'bToA'
}

export const swap = async ({
  blockfrostProjectId,
  networkId,
  mnemonic,
  shareAssetName,
  quantityX,
  direction,
}: SwapParams) => {
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

  const lockX = new BigNumber(quantityX)
  const aToB = direction === 'aToB'

  const {outY} = computeNewReserves({
    currentX: aToB ? poolState.qtyA : poolState.qtyB,
    currentY: aToB ? poolState.qtyB : poolState.qtyA,
    lockX,
    swapFeePoints: poolState.swapFeePoints,
    feeBasis: poolState.feeBasis,
  })
  console.info(`Building transaction with outY = ${outY}`)

  const {builtTx, txFee} = await buildSwapTx({
    wallet,
    fetcher: blockchainProvider,
    poolState,
    aToB,
    lockX,
    outY,
  })

  await signAndSubmitTx({builtTx, txFee, wallet})
}
