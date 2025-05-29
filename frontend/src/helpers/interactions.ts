import type {Updater} from '@tanstack/react-query'
import {type Interaction, sortInteractions} from '@wingriders/rapid-dex-common'

export const getInteractionsQueryDataUpdater =
  (
    updatedItem: Interaction,
    filterOnlyUnconfirmed?: boolean,
  ): Updater<Interaction[] | undefined, Interaction[] | undefined> =>
  (existingItems) => {
    if (!existingItems)
      return filterOnlyUnconfirmed && updatedItem.slot != null
        ? existingItems // don't update the query data if we are filtering only unconfirmed and the interaction is confirmed
        : [updatedItem]

    const result = existingItems.some((i) => i.txHash === updatedItem.txHash)
      ? // if the interaction is already in the query data, update it
        existingItems.map((i) =>
          i.txHash === updatedItem.txHash ? updatedItem : i,
        )
      : // otherwise, add it to the query data
        [updatedItem, ...existingItems]

    return (
      filterOnlyUnconfirmed ? result.filter((i) => i.slot == null) : result
    ).sort(sortInteractions)
  }
