import {config} from './config'

// Shelley initial block
// TODO Set when creating first pool output
export const originPoint = {
  mainnet: {
    id: 'aa83acbf5904c0edfe4d79b3689d3d00fcfc553cf360fd2229b98d464c28e9de',
    slot: 4492800,
    height: 4490511,
  },
  preprod: {
    id: 'c971bfb21d2732457f9febf79d9b02b20b9a3bef12c561a78b818bcb8b35a574',
    slot: 86400,
    height: 46,
  },
}[config.NETWORK]
