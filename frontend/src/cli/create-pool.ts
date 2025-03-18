import {computeSharesCreatePool} from '@/amm/create-pool'
import {initContext, signAndSubmitTx} from '@/cli/common'
import {buildCreatePoolTx} from '@/onChain/transaction/create-pool'
import type {RefTxIn} from '@meshsdk/core'
import {type NetworkId, getShareAssetName} from '@wingriders/rapid-dex-common'
import BigNumber from 'bignumber.js'

type CreatePoolParams = {
  blockfrostProjectId: string
  networkId: NetworkId
  mnemonic: string
  unitA: string
  quantityA: number
  unitB: string
  quantityB: number
  swapFeePoints: number
  feeBasis: number
}

export const createPool = async ({
  blockfrostProjectId,
  networkId,
  mnemonic,
  unitA,
  quantityA,
  unitB,
  quantityB,
  swapFeePoints,
  feeBasis,
}: CreatePoolParams) => {
  const {blockchainProvider, wallet, utxos} = await initContext({
    blockfrostProjectId,
    networkId,
    mnemonic,
  })
  const seedUtxo = utxos[0]
  const outShares = computeSharesCreatePool({
    lockA: new BigNumber(quantityA),
    lockB: new BigNumber(quantityB),
  })
  const seed: RefTxIn = {
    txHash: seedUtxo.input.txHash,
    txIndex: seedUtxo.input.outputIndex,
  }
  console.info(
    `Building transaction with outShares = ${outShares}, shareAssetName = ${getShareAssetName(seed)}`,
  )

  const {builtTx, txFee} = await buildCreatePoolTx({
    wallet,
    fetcher: blockchainProvider,
    assetA: {unit: unitA, quantity: String(quantityA)},
    assetB: {unit: unitB, quantity: String(quantityB)},
    outShares,
    seed,
    feeBasis,
    swapFeePoints,
  })

  await signAndSubmitTx({builtTx, txFee, wallet})
}
