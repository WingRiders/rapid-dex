import type {TokenMetadata} from '@wingriders/rapid-dex-common'
import {compact, omit} from 'lodash'
import {
  getTokenMetadataFromCache,
  getTokensMetadataFromCache,
} from '../tokenRegistry'

const prepareTokenMetadataForOutput = (tokenMetadata: TokenMetadata) =>
  omit(tokenMetadata, 'logo')

export const getTokensMetadata = (subjects: string[]) =>
  Object.fromEntries(
    compact(getTokensMetadataFromCache(subjects)).map((metadata) => [
      metadata.subject,
      prepareTokenMetadataForOutput(metadata),
    ]),
  )

export const getTokenMetadata = (subject: string) => {
  const tokenMetadata = getTokenMetadataFromCache(subject)
  if (!tokenMetadata) return null
  return prepareTokenMetadataForOutput(tokenMetadata)
}
