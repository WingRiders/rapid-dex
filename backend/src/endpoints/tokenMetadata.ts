import {omit} from 'lodash'
import {getTokenMetadataCache} from '../tokenRegistry'

export const getTokenMetadata = (subjects: string[]) =>
  getTokenMetadataCache(subjects).map((tokenMetadata) =>
    omit(tokenMetadata, 'logo'),
  )
