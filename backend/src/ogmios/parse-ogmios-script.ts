import type {Script} from '@cardano-ogmios/schema'
import {ScriptVersion} from '@prisma/client'

const ogmiosScriptVersionToScriptVersionMapping: Record<string, ScriptVersion> =
  {
    'plutus:v1': ScriptVersion.V1,
    'plutus:v2': ScriptVersion.V2,
    'plutus:v3': ScriptVersion.V3,
  }

export const parseOgmiosScript = (ogmiosScript?: Script) => {
  if (!ogmiosScript) return null
  const version =
    ogmiosScriptVersionToScriptVersionMapping[ogmiosScript.language]
  return version ? {version, cbor: ogmiosScript.cbor} : null
}
