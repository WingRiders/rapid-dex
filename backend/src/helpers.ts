import type {Point} from '@cardano-ogmios/schema'
import {config} from './config'

export const originPoint = {
  mainnet: {
    // Shelley initial block
    id: 'aa83acbf5904c0edfe4d79b3689d3d00fcfc553cf360fd2229b98d464c28e9de',
    slot: 4492800,
    height: 4490511,
  },
  preprod: {
    // First pool was created in this transaction: https://preprod.cexplorer.io/tx/0afd77f485d648be6eabdfc3d197264343956711fe20c3b5d3c0157eccb4b0fa
    // Origin point need to be 1 block before that
    id: 'ee074bb54cdf6dd6393c7196bc2f3033153dee857b52be43df27daefa2c7a5cd',
    slot: 109238961,
    height: 4197720,
  },
}[config.NETWORK]

export const tipToSlot = (tip: Point | 'origin') =>
  tip === 'origin' ? originPoint.slot : tip.slot
