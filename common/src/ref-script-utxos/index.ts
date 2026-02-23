import type {UTxO} from '@meshsdk/core'
import type {SupportedNetwork} from '../helpers'
import {
  mainnetPoolRefScriptSize,
  mainnetPoolRefScriptUtxo,
  mainnetPoolScriptAddress,
} from './mainnet'
import {
  preprodPoolRefScriptSize,
  preprodPoolRefScriptUtxo,
  preprodPoolScriptAddress,
} from './preprod'

export const poolRefScriptUtxoByNetwork: Record<SupportedNetwork, UTxO> = {
  preprod: preprodPoolRefScriptUtxo,
  mainnet: mainnetPoolRefScriptUtxo,
}

export const poolRefScriptSizeByNetwork: Record<SupportedNetwork, number> = {
  preprod: preprodPoolRefScriptSize,
  mainnet: mainnetPoolRefScriptSize,
}

export const poolScriptAddressByNetwork: Record<SupportedNetwork, string> = {
  preprod: preprodPoolScriptAddress,
  mainnet: mainnetPoolScriptAddress,
}
