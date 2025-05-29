import type {Redeemer, TransactionOutput} from '@cardano-ogmios/schema'
import {deserializeDatum} from '@meshsdk/core'
import {PoolInteractionType} from '@prisma/client'
import {
  poolScriptAddressByNetwork,
  poolValidatorHash,
  poolValidityAssetNameHex,
} from '@wingriders/rapid-dex-common'
import {config} from '../config'
import {logger} from '../logger'

export const isPoolOutput = (output: TransactionOutput) =>
  output.address === poolScriptAddressByNetwork[config.NETWORK] &&
  output.value[poolValidatorHash]?.[poolValidityAssetNameHex] === 1n

export const getSpentPoolInteractionType = (
  txRedeemers: Redeemer[] | undefined,
): PoolInteractionType => {
  if (!txRedeemers || txRedeemers.length !== 1) {
    logger.error({txRedeemers}, 'Invalid transaction redeemers')
    throw new Error('Invalid transaction redeemers')
  }
  const redeemerData = deserializeDatum(txRedeemers[0]!.redeemer)

  switch (redeemerData.constructor) {
    case 0n:
      return PoolInteractionType.Swap
    case 1n:
      return PoolInteractionType.AddLiquidity
    case 2n:
      return PoolInteractionType.WithdrawLiquidity
    case 3n:
      return PoolInteractionType.Donate
    default:
      logger.error({redeemerData}, 'Unknown redeemer datum')
      throw new Error('Unknown redeemer datum')
  }
}
