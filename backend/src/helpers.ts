import {config} from './config'

export const originPoint = {
  mainnet: {
    // Shelley initial block
    id: 'aa83acbf5904c0edfe4d79b3689d3d00fcfc553cf360fd2229b98d464c28e9de',
    slot: 4492800,
    height: 4490511,
  },
  preprod: {
    id: '90b13c95a0988dd097a5c4be510dab3b4157be23876df151f43eeb3683ce867a',
    slot: 85566517,
    height: 3252089,
  },
}[config.NETWORK]
