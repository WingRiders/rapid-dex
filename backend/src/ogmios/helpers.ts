import type {TransactionOutput} from '@cardano-ogmios/schema'
import {
  poolScriptAddressByNetwork,
  poolValidatorHash,
  poolValidityAssetNameHex,
} from '@wingriders/rapid-dex-common'
import {config} from '../config'

export const isPoolOutput = (output: TransactionOutput) =>
  output.address === poolScriptAddressByNetwork[config.NETWORK] &&
  output.value[poolValidatorHash]?.[poolValidityAssetNameHex] === 1n
