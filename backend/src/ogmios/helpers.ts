import {config} from '@/config'
import type {TransactionOutput} from '@cardano-ogmios/schema'
import {
  poolScriptAddressByNetwork,
  poolValidatorHash,
  poolValidityAssetNameHex,
} from '@wingriders/rapid-dex-common'

export const isPoolOutput = (output: TransactionOutput) =>
  output.address === poolScriptAddressByNetwork[config.NETWORK] &&
  output.value[poolValidatorHash]?.[poolValidityAssetNameHex] === 1n
