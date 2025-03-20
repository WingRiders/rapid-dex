import {config} from './config'

export const originPoint = {
  mainnet: {
    // Shelley initial block
    id: 'aa83acbf5904c0edfe4d79b3689d3d00fcfc553cf360fd2229b98d464c28e9de',
    slot: 4492800,
    height: 4490511,
  },
  preprod: {
    id: '2c3985ab424e7d5f683f3529c6e18638cfc4289e7a4d0a279b4169f4d2b38302',
    slot: 86531256,
    height: 3287900,
  },
}[config.NETWORK]
