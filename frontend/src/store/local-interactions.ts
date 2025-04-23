import type {Interaction} from '@wingriders/rapid-dex-common'
import {create} from 'zustand'
import {persist} from 'zustand/middleware'

export type LocalInteractionsState = {
  unconfirmedInteractions: Interaction[]
  addUnconfirmedInteraction: (interaction: Interaction) => void
  removeUnconfirmedInteractions: (txHashes: string[]) => void
  clear: () => void
}

export const useLocalInteractionsStore = create<LocalInteractionsState>()(
  persist(
    (set) => ({
      unconfirmedInteractions: [],
      addUnconfirmedInteraction: (interaction: Interaction) =>
        set((state) => ({
          unconfirmedInteractions: [
            ...state.unconfirmedInteractions,
            interaction,
          ],
        })),
      removeUnconfirmedInteractions: (txHashes: string[]) =>
        set((state) => ({
          unconfirmedInteractions: state.unconfirmedInteractions.filter(
            (interaction) => !txHashes.includes(interaction.txHash),
          ),
        })),
      clear: () => set({unconfirmedInteractions: []}),
    }),
    {
      name: 'interactions',
    },
  ),
)
