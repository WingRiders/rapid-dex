import {type PoolState, utxoToPoolState} from '@/onChain/transaction/pool-state'
import type {IWallet} from '@meshsdk/common'
import {BlockfrostProvider, type IFetcher, MeshWallet} from '@meshsdk/core'
import {
  poolScriptAddressByNetwork,
  poolValidatorHash,
  poolValidityAssetNameHex,
  walletNetworkIdToNetwork,
} from '@wingriders/rapid-dex-common'
import type BigNumber from 'bignumber.js'

type InitContextParams = {
  blockfrostProjectId: string
  networkId: 0 | 1
  mnemonic: string
}

export const initContext = async ({
  blockfrostProjectId,
  networkId,
  mnemonic,
}: InitContextParams) => {
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
  return {blockchainProvider, wallet, utxos}
}

type GetPoolStateParams = {
  networkId: 0 | 1
  shareAssetName: string
  fetcher: IFetcher
}

export const getPoolState = async ({
  networkId,
  shareAssetName,
  fetcher,
}: GetPoolStateParams): Promise<PoolState> => {
  const network = walletNetworkIdToNetwork(networkId)
  const shareUnit = `${poolValidatorHash}${shareAssetName}`
  const poolUtxos = await fetcher.fetchAddressUTxOs(
    poolScriptAddressByNetwork[network],
    shareUnit,
  )
  const poolValidityUnit = `${poolValidatorHash}${poolValidityAssetNameHex}`
  const poolUtxo = poolUtxos.find((utxo) =>
    utxo.output.amount.map(({unit}) => unit).includes(poolValidityUnit),
  )
  if (!poolUtxo)
    throw new Error(
      `There is no UTxO on pool address ${poolScriptAddressByNetwork[network]}, share asset ${shareUnit} and pool validity asset ${poolValidityUnit}`,
    )
  return utxoToPoolState(poolUtxo)
}

type SignAndSubmitTxParams = {
  builtTx: string
  txFee: BigNumber
  wallet: IWallet
}

export const signAndSubmitTx = async ({
  builtTx,
  txFee,
  wallet,
}: SignAndSubmitTxParams) => {
  console.info({txFee}, 'Signing transaction')
  const signedTx = await wallet.signTx(builtTx)
  console.info({txSize: signedTx.length / 2}, 'Submitting transaction')
  try {
    const txHash = await wallet.submitTx(signedTx)
    console.info('Transaction submitted with hash:', txHash)
  } catch (e: unknown) {
    console.info({signedTx}, 'Error when submitting transaction')
    console.error(e instanceof Error ? e.message : JSON.stringify(e))
  }
}
