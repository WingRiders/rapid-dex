import {
  preprodPoolRefScriptSize,
  preprodPoolRefScriptUtxo,
  preprodPoolScriptAddress,
} from './preprod'

export const poolRefScriptUtxoByNetwork = {
  preprod: preprodPoolRefScriptUtxo,
}

export const poolRefScriptSizeByNetwork = {
  preprod: preprodPoolRefScriptSize,
}

export const poolScriptAddressByNetwork = {
  preprod: preprodPoolScriptAddress,
}
