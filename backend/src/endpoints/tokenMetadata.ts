import {getTokenMetadataCache} from '@/tokenRegistry'
import {omit} from 'lodash'

export const getTokenMetadata = (subjects: string[]) =>
  getTokenMetadataCache(subjects).map((tokenMetadata) =>
    omit(tokenMetadata, 'logo'),
  )
