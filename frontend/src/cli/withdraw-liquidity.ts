import {computeReturnedTokens} from '@/amm/withdraw-liquidity'
import {getPoolState, initContext, signAndSubmitTx} from '@/cli/common'
import {buildWithdrawLiquidityTx} from '@/onChain/transaction/withdraw-liquidity'
import type {NetworkId} from '@wingriders/rapid-dex-common'
import BigNumber from 'bignumber.js'

type WithdrawLiquidityParams = {
  blockfrostProjectId: string
  networkId: NetworkId
  mnemonic: string
  shareAssetName: string
  quantityShares: number
}

export const withdrawLiquidity = async ({
  blockfrostProjectId,
  networkId,
  mnemonic,
  shareAssetName,
  quantityShares,
}: WithdrawLiquidityParams) => {
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

  const lockShares = new BigNumber(quantityShares)

  const {outA, outB} = computeReturnedTokens({
    lockShares,
    currentA: poolState.qtyA,
    currentB: poolState.qtyB,
    currentShares: poolState.qtyShares,
  })
  console.info(`Building transaction with outA = ${outA}, outB = ${outB}`)

  const {builtTx, txFee} = await buildWithdrawLiquidityTx({
    wallet,
    fetcher: blockchainProvider,
    poolState,
    lockShares,
    outA,
    outB,
  })

  await signAndSubmitTx({builtTx, txFee, wallet})
}
