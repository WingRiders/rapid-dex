import {BlockfrostProvider, type MeshValue, MeshWallet} from '@meshsdk/core'
import {bigintToBigNumber} from '@wingriders/rapid-dex-common'
import BigNumber from 'bignumber.js'
import {InvalidArgumentError} from 'commander'
import type {ConfigObject} from './config'

export const parseIntegerOption =
  (options: {min?: number; max?: number} = {}) =>
  (value: string, _previous: number) => {
    const parsedValue = Number.parseInt(value, 10)
    if (Number.isNaN(parsedValue)) {
      throw new InvalidArgumentError('Must be a valid integer number.')
    }
    if (options.min != null && parsedValue < options.min) {
      throw new InvalidArgumentError(
        `Must be greater than or equal to ${options.min}.`,
      )
    }
    if (options.max != null && parsedValue > options.max) {
      throw new InvalidArgumentError(
        `Must be less than or equal to ${options.max}.`,
      )
    }
    return parsedValue
  }

export const parseBigNumberOption = (value: string, _previous: BigNumber) => {
  const parsedValue = new BigNumber(value)
  if (parsedValue.isNaN() || !parsedValue.isInteger()) {
    throw new InvalidArgumentError('Must be an integer number.')
  }
  return parsedValue
}

export const parsePositiveBigNumberOption = (
  value: string,
  _previous: BigNumber,
) => {
  const parsedValue = parseBigNumberOption(value, _previous)
  if (parsedValue.lte(0)) {
    throw new InvalidArgumentError('Must be a positive integer number.')
  }
  return parsedValue
}

export const initWallet = async (
  config: Pick<
    ConfigObject,
    'NETWORK_ID' | 'BLOCKFROST_PROJECT_ID' | 'WALLET_MNEMONIC'
  >,
) => {
  const provider = new BlockfrostProvider(config.BLOCKFROST_PROJECT_ID)

  const wallet = new MeshWallet({
    networkId: config.NETWORK_ID,
    fetcher: provider,
    submitter: provider,
    key: {
      type: 'mnemonic',
      words: config.WALLET_MNEMONIC.split(' '),
    },
  })
  await wallet.init()

  return wallet
}

export const assertSufficientBalance = (
  value: MeshValue,
  unit: string,
  requestedQuantity: BigNumber,
) => {
  const availableBalance = value.get(unit)
  if (requestedQuantity.gt(bigintToBigNumber(availableBalance))) {
    throw new InvalidArgumentError(`Insufficient balance of ${unit}`)
  }
}
