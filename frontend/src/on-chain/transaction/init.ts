import type {IFetcher, IWallet, RefTxIn} from '@meshsdk/core'
import {
  deserializeAddress,
  MeshTxBuilder,
  OfflineFetcher,
  type UTxO,
} from '@meshsdk/core'
import {matchUtxo, walletNetworkIdToNetwork} from '@wingriders/rapid-dex-common'
import {calculateTtl} from '@/on-chain/transaction/ttl'
import {getWalletCollateralUtxo} from '../collateral'

type InitTxBuilderArgs = {
  wallet: IWallet
  additionalUtxos?: UTxO[]
  doNotSpendUtxos?: RefTxIn[]
  fetcher?: IFetcher
  now?: Date // if not provided, the current date will be used
}

export const initTxBuilder = async ({
  wallet,
  additionalUtxos,
  doNotSpendUtxos,
  fetcher,
  now = new Date(),
}: InitTxBuilderArgs) => {
  const network = walletNetworkIdToNetwork(await wallet.getNetworkId())
  const walletUtxos = await wallet.getUtxos()
  const collateralUtxo = await getWalletCollateralUtxo(wallet, walletUtxos)
  if (!collateralUtxo) {
    throw new Error('No collateral UTxO found')
  }
  const isCollateral = matchUtxo(collateralUtxo.input)
  const availableWalletUtxos = walletUtxos.filter(
    (utxo) =>
      !isCollateral(utxo.input) &&
      !(doNotSpendUtxos ?? []).some(({txHash, txIndex}) =>
        matchUtxo(utxo.input)({txHash, outputIndex: txIndex}),
      ),
  )

  const changeAddress = await wallet.getChangeAddress()

  const {pubKeyHash: authorityKeyHex} = deserializeAddress(changeAddress)

  if (fetcher == null) {
    const offlineFetcher = new OfflineFetcher()
    offlineFetcher.addUTxOs([
      ...walletUtxos,
      ...(additionalUtxos ?? []),
      collateralUtxo,
    ])
    fetcher = offlineFetcher
  }
  const coreCsl = await import('@meshsdk/core-csl')
  const evaluator = new coreCsl.OfflineEvaluator(fetcher, network)

  const txBuilder = new MeshTxBuilder({
    evaluator: {
      evaluateTx: (tx) => evaluator.evaluateTx(tx, [], []),
    },
    fetcher,
  })
    .setNetwork(network)
    .selectUtxosFrom(availableWalletUtxos)
    .changeAddress(changeAddress)
    .requiredSignerHash(authorityKeyHex)
    .invalidHereafter(calculateTtl(now, network))
    .txInCollateral(
      collateralUtxo.input.txHash,
      collateralUtxo.input.outputIndex,
      collateralUtxo.output.amount,
      collateralUtxo.output.address,
    )

  return {
    walletUtxos,
    collateralUtxo,
    changeAddress,
    network,
    authorityKeyHex,
    txBuilder,
  }
}
