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
    // First pool was created in this transaction: https://preprod.cardanoscan.io/transaction/de232c0234a6f1b964fe6a00514a75f758ec01551e7c1fe399bc474e8a55b276
    // Origin point need to be 1 block before that
    id: '42bc57652b1df6ce7df5169f56f4d2f058745d0f775703e17746335c6834fef9',
    slot: 106658607,
    height: 4088123,
  },
}[config.NETWORK]

export const tipToSlot = (tip: Point | 'origin') =>
  tip === 'origin' ? originPoint.slot : tip.slot
