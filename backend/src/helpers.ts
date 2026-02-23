import type {Point, Tip} from '@cardano-ogmios/schema'
import {config} from './config'

export const originPoint: Tip = {
  mainnet: {
    // First pool was created in this transaction: https://cexplorer.io/tx/8e7c8c9634415debd6d235a823440f1823135550af229baf883d610e29d660b8
    // Origin point need to be 1 block before that
    id: '33be6e26f7274e4250a8fdeb803bd779245f59059d5493687aee010da5f1184a',
    slot: 180287225,
    height: 13077423,
  },
  preprod: {
    // First pool was created in this transaction: https://preprod.cexplorer.io/tx/9b6b32206f1f000f8f9c245301088c6c4f7fac7151dd5f27c859ee30bf6126a5
    // Origin point need to be 1 block before that
    id: 'f097dcce91dc774a6eb508230e36cfb966b9769a1928a6d9886e7cfa847b52ac',
    slot: 116165041,
    height: 4449083,
  },
}[config.NETWORK]

export const tipToSlot = (tip: Point | 'origin') =>
  tip === 'origin' ? originPoint.slot : tip.slot
