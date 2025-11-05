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
    // TODO Set to the point 1 block before first pool is created
    id: 'e8dbe8276fc4768ce985c3afd97a92e4b27cbe5dae332f4f2e6727055cd81e8b',
    slot: 106587008,
    height: 4085086,
  },
}[config.NETWORK]

export const tipToSlot = (tip: Point | 'origin') =>
  tip === 'origin' ? originPoint.slot : tip.slot
