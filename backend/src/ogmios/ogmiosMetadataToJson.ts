import type {MetadatumDetailedSchema, Transaction} from '@cardano-ogmios/schema'
import {mapValues} from 'lodash'
import {match, P} from 'ts-pattern'

export const ogmiosMetadataToJson = (transaction: Transaction) => {
  const metadataLabels = transaction.metadata?.labels
  if (!metadataLabels) {
    return undefined
  }
  return mapValues(metadataLabels, ({json}) => {
    if (!json) {
      throw new Error('Metadata with no json field')
    }
    return parseOgmiosMetadatumDetailedSchemaToObject(
      json as MetadatumDetailedSchema,
    )
  })
}

const sanitizeNullByte = (input: string): string =>
  input
    .split('')
    .map((char) => (char === '\u0000' ? '\\u0000' : char))
    .join('')

/**
 * Mapping between ogmios metadatum and the javascript
 * object representation by stringifying the non-string keys.
 *
 * Buffers are handled as hex-encoded strings.
 *
 * The result is intended to be stored in a JSONB type, so null byte needs to be sanitized.
 */
export const parseOgmiosMetadatumDetailedSchemaToObject = (
  metadatum: MetadatumDetailedSchema,
): any => {
  return match(metadatum)
    .with({int: P.select()}, (val) =>
      Number.MIN_SAFE_INTEGER <= val && val <= Number.MAX_SAFE_INTEGER
        ? Number(val)
        : String(val),
    )
    .with({string: P.select()}, (val) => sanitizeNullByte(val))
    .with({bytes: P.select()}, (val) => val)
    .with({list: P.select()}, (val) =>
      val.map(parseOgmiosMetadatumDetailedSchemaToObject),
    )
    .with({map: P.select()}, (val) =>
      Object.fromEntries(
        val.map(({k, v}) => [
          String(parseOgmiosMetadatumDetailedSchemaToObject(k)),
          parseOgmiosMetadatumDetailedSchemaToObject(v),
        ]),
      ),
    )
    .exhaustive()
}
