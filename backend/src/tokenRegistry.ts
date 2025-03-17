import type {TokenMetadata} from '@wingriders/rapid-dex-common'
import {minutesToMilliseconds} from 'date-fns'
import {chunk, keyBy} from 'lodash'
import {type ZodSchema, z} from 'zod'
import {config} from './config'
import {logger} from './logger'

let tokenMetadataCache: {[subject: string]: TokenMetadata} = {}
export const getTokenMetadataCache = (subjects: string[]) =>
  subjects.map((subject) => tokenMetadataCache[subject])
export const getTokenLogo = (subject: string) =>
  tokenMetadataCache[subject]?.logo

const githubTokenMetadataFieldSchema = (valueSchema: ZodSchema) =>
  z.object({
    value: valueSchema,
  })

const githubTokenMetadataSchema = z
  .object({
    subject: z.string(),
    name: githubTokenMetadataFieldSchema(z.string()),
    description: githubTokenMetadataFieldSchema(z.string()),
    policy: z.string().optional(),
    ticker: githubTokenMetadataFieldSchema(z.string()).optional(),
    url: githubTokenMetadataFieldSchema(z.string()).optional(),
    logo: githubTokenMetadataFieldSchema(z.string()).optional(),
    decimals: githubTokenMetadataFieldSchema(z.number()).optional(),
  })
  .transform(({subject, name, description, ticker, url, logo, decimals}) => ({
    subject,
    name: name.value,
    description: description.value,
    ticker: ticker?.value,
    url: url?.value,
    logo: logo?.value,
    decimals: decimals?.value,
  }))

const MAX_SUBJECTS_TO_FETCH = 200

const LOOP_INTERVAL = minutesToMilliseconds(15)

const {
  githubTokenRegistry,
  subjectsPath,
  tokenRegistryUrl,
  adaNetworkSpecificMetadata,
} = {
  mainnet: {
    githubTokenRegistry:
      'https://api.github.com/repos/cardano-foundation/cardano-token-registry',
    subjectsPath: 'mappings',
    tokenRegistryUrl: 'https://tokens.cardano.org/metadata/query',
    adaNetworkSpecificMetadata: {
      description: 'Cardano ADA',
      ticker: 'ADA',
      name: 'ADA',
    },
  },
  preprod: {
    githubTokenRegistry:
      'https://api.github.com/repos/input-output-hk/metadata-registry-testnet',
    subjectsPath: 'registry',
    tokenRegistryUrl: 'https://metadata.world.dev.cardano.org/metadata/query',
    adaNetworkSpecificMetadata: {
      description: 'Testnet ADA',
      ticker: 'tADA',
      name: 'tADA',
    },
  },
}[config.NETWORK]

const adaMetadata: TokenMetadata = {
  ...adaNetworkSpecificMetadata,
  subject: '',
  decimals: 6,
}

const githubCommitsResponseSchema = z.array(
  z.object({
    commit: z.object({tree: z.object({sha: z.string()})}),
  }),
)

const getLastCommitTree = async (): Promise<string> => {
  logger.info('Fetching lastCommitTree')
  const response = await fetch(`${githubTokenRegistry}/commits`)
  const json = await response.json()
  return githubCommitsResponseSchema.parse(json)[0].commit.tree.sha
}

const githubTreeResponseSchema = z.object({
  sha: z.string(),
  url: z.string(),
  tree: z.array(
    z.object({
      path: z.string(),
      sha: z.string(),
      url: z.string(),
      type: z.string(),
    }),
  ),
})

const getMetadataFolderTree = async (commitTree: string): Promise<string> => {
  logger.info(`Fetching metadata folder tree ${commitTree}`)
  // https://docs.github.com/en/rest/git/trees
  const response = await fetch(`${githubTokenRegistry}/git/trees/${commitTree}`)
  const json = await response.json()
  return githubTreeResponseSchema
    .parse(json)
    .tree.find(({path}) => path === subjectsPath)!.sha
}

const getSubjects = async (registryTree: string): Promise<string[]> => {
  logger.info(`Fetching subjects: ${registryTree}`)
  const response = await fetch(
    `${githubTokenRegistry}/git/trees/${registryTree}`,
  )
  const json = await response.json()
  const subjectFiles = githubTreeResponseSchema
    .parse(json)
    .tree.map(({path}: {path: string}) => path)
    .filter((path: string) => path.endsWith('.json'))
  // format is subject.json
  // example: 00000002df633853f6a47465c9496721d2d5b1291b8398016c0e87ae6e7574636f696e.json
  return subjectFiles.map((path: string) => path.split('.')[0])
}

const fetchMetadataForSubjects = async (
  subjects: string[],
): Promise<TokenMetadata[]> => {
  const response = await fetch(`${tokenRegistryUrl}`, {
    method: 'post',
    body: JSON.stringify({subjects}),
    headers: {'Content-Type': 'application/json'},
  })
  const subjectsResponseSchema = z.object({
    subjects: z.array(githubTokenMetadataSchema),
  })
  const json = await response.json()
  return subjectsResponseSchema.parse(json).subjects
}

/**
 * Tries to fetch subjects in a chunks of size chunkSize - this may fail because some tokens have big metadata and
 * cardano.org changes the api limits, so it's impossible to set a chunk size that would work for all cases.
 * Therefore, we recursively try to downsize the chunks and fetch smaller ones.
 * @param subjects
 * @param chunkSize
 * @param metadataResponses mutable array in which to append the token metadata
 */
async function chunkedSubjectsFetcher(
  subjects: string[],
  chunkSize: number,
  metadataResponses: TokenMetadata[],
) {
  const subjectsChunks = chunk(subjects, chunkSize)
  logger.info(
    `Requesting metadata for ${subjects.length} subjects, with max ${chunkSize} subjects in 1 request (${subjectsChunks.length} requests total)`,
  )
  for (let i = 0; i < subjectsChunks.length; i++) {
    const subjectsChunk = subjectsChunks[i]
    const chunkNumber = i + 1

    logger.info(
      `Chunk[${chunkSize}] ${chunkNumber}: requesting metadata for ${subjectsChunk.length} subjects`,
    )
    try {
      const response = await fetchMetadataForSubjects(subjectsChunk)
      metadataResponses.push(...response)
      logger.info(
        `Chunk[${chunkSize}] ${chunkNumber}: successfully fetched metadata for ${response.length} subjects, metadataResponses has ${metadataResponses.length} rows`,
      )
      await Bun.sleep(1000)
    } catch (e) {
      logger.warn(
        `Chunk[${chunkSize}] ${chunkNumber}: failing, trying smaller chunks`,
      )
      if (chunkSize > 1) {
        await chunkedSubjectsFetcher(
          subjectsChunk,
          chunkSize / 2,
          metadataResponses,
        )
      } else {
        logger.warn(`Couldn't fetch metadata for ${subjectsChunk}`)
        throw e
      }
    }
  }
}

const getNewTokenMetadata = async (): Promise<TokenMetadata[]> => {
  const lastCommitTree = await getLastCommitTree()
  const registryTree = await getMetadataFolderTree(lastCommitTree)
  const subjects = await getSubjects(registryTree)

  const tokenMetadata: TokenMetadata[] = []
  await chunkedSubjectsFetcher(
    subjects.slice(0, 200),
    MAX_SUBJECTS_TO_FETCH,
    tokenMetadata,
  )
  logger.info(
    {subjectCount: subjects.length, metadataCount: tokenMetadata.length},
    'Successfully fetched new metadata',
  )
  return tokenMetadata
}

export const tokensMetadataLoop = async () => {
  while (true) {
    logger.info('Fetching new metadata')
    try {
      const newTokenMetadata = await getNewTokenMetadata()
      if (newTokenMetadata.length > 0) {
        newTokenMetadata.push(adaMetadata)
        tokenMetadataCache = keyBy(newTokenMetadata, 'subject')
        logger.info(
          {
            tokenMetadataCache: newTokenMetadata.length,
          },
          'Saved token metadata to the cache',
        )
      } else {
        logger.warn('Empty token metadata response')
      }
    } catch (error: any) {
      logger.warn(
        `Error loading token metadata: ${error.message}${
          error.config?.url ? `, URL: ${error.config.url}` : ''
        }`,
      )
    }

    await Bun.sleep(LOOP_INTERVAL)
  }
}
