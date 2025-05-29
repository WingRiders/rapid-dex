import type {Unit} from '@meshsdk/core'
import type BigNumber from 'bignumber.js'

export enum InteractionType {
  CREATE_POOL = 'CREATE_POOL',
  SWAP = 'SWAP',
  ADD_LIQUIDITY = 'ADD_LIQUIDITY',
  WITHDRAW_LIQUIDITY = 'WITHDRAW_LIQUIDITY',
  DONATE = 'DONATE',
}

export type InteractionSpecificFields = {
  [InteractionType.CREATE_POOL]: {
    qtyA: BigNumber
    qtyB: BigNumber
    earnedShares: BigNumber
  }
  [InteractionType.SWAP]: {
    aToB: boolean
    lockX: BigNumber
    outY: BigNumber
  }
  [InteractionType.ADD_LIQUIDITY]: {
    lockA: BigNumber
    lockB: BigNumber
    earnedShares: BigNumber
  }
  [InteractionType.WITHDRAW_LIQUIDITY]: {
    lockShares: BigNumber
    outA: BigNumber
    outB: BigNumber
  }
  [InteractionType.DONATE]: {
    donatedA: BigNumber
    donatedB: BigNumber
  }
}

export type InteractionSpecificFieldsWithType = {
  [K in InteractionType]: {
    type: K
  } & InteractionSpecificFields[K]
}[InteractionType]

export type Interaction = {
  txHash: string
  slot?: number // undefined if the interaction hasn't been confirmed yet
  pool: {
    shareAssetName: string
    unitA: Unit
    unitB: Unit
  }
} & InteractionSpecificFieldsWithType
