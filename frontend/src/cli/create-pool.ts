import {computeSharesCreatePool} from '@/amm/create-pool'
import {buildCreatePoolTx} from '@/onChain/transaction/create-pool'
import {BlockfrostProvider, MeshValue, MeshWallet} from '@meshsdk/core'
import {type NetworkId, poolOil} from '@wingriders/rapid-dex-common'
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
  const blockchainProvider = new BlockfrostProvider(blockfrostProjectId)
  console.info('Init wallet')
  const wallet = new MeshWallet({
    networkId,
    fetcher: blockchainProvider,
    submitter: blockchainProvider,
    key: {
      type: 'mnemonic',
      words: mnemonic.split(' '),
    },
  })

  console.info('Fetching addresses')
  await wallet.init()

  console.info('Fetching UTxOs')
  const utxos = await wallet.getUtxos()
  if (utxos.length === 0) {
    console.error('Found no UTxOs, exiting')
    process.exit(1)
  }
  console.info(`Found ${utxos.length} UTxOs`)

  const requiredQuantityA =
    unitA === 'lovelace'
      ? quantityA + poolOil.toNumber() + 3_000_000 // min_ada on both outputs + tx fee
      : quantityA
  const seedUtxo = utxos.find((utxo) => {
    const meshValue = MeshValue.fromAssets(utxo.output.amount)
    const lovelaceOK =
      unitA === 'lovelace' || meshValue.get('lovelace') >= 3_000_000 // min_ada on both outputs + tx fee
    return (
      meshValue.get(unitA) >= requiredQuantityA &&
      meshValue.get(unitB) >= quantityB &&
      lovelaceOK
    )
  })
  if (!seedUtxo) {
    console.error(
      `Could not find seedUtxo (requiredQuantityA = ${requiredQuantityA})`,
    )
    process.exit(1)
  }

  const outShares = computeSharesCreatePool({
    lockA: new BigNumber(quantityA),
    lockB: new BigNumber(quantityB),
  })
  console.info(`Building transaction with outShares = ${outShares}`)

  const {builtTx, txFee} = await buildCreatePoolTx({
    wallet,
    fetcher: blockchainProvider,
    assetA: {unit: unitA, quantity: String(quantityA)},
    assetB: {unit: unitB, quantity: String(quantityB)},
    outShares,
    seed: {txHash: seedUtxo.input.txHash, txIndex: seedUtxo.input.outputIndex},
    feeBasis,
    swapFeePoints,
  })

  console.info({txFee}, 'Signing transaction')
  const signedTx = await wallet.signTx(builtTx)
  console.info({txSize: signedTx.length / 2}, 'Submitting transaction')
  const txHash = await wallet.submitTx(signedTx)
  console.info('Transaction submitted with hash:', txHash)
}
