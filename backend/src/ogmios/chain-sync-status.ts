import type {Origin, Tip} from '@cardano-ogmios/schema'
import {sleep} from '@wingriders/rapid-dex-common'
import {secondsToMilliseconds} from 'date-fns'

let chainSynced = false

/**
 * @returns true if the chain tip is closed enough to the current block height (blockHeight >= tip.height - 1)
 */
export const isChainSynced = () => chainSynced

export const updateChainSyncStatus = (
  tip: Tip | Origin,
  blockHeight: number,
) => {
  chainSynced = tip !== 'origin' && blockHeight >= tip.height - 1
}

export const waitUntilChainSynced = async (
  pollingInterval = secondsToMilliseconds(10),
) => {
  while (!isChainSynced()) {
    await sleep(pollingInterval)
  }
}
