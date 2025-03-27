import type {Interaction} from '@wingriders/rapid-dex-common'
import {create} from 'zustand'
import {persist} from 'zustand/middleware'

export type LocalInteractionsState = {
  unconfirmedInteractions: Interaction[]
  addUnconfirmedInteraction: (interaction: Interaction) => void
  removeUnconfirmedInteraction: (txHash: string) => void
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
      removeUnconfirmedInteraction: (txHash: string) =>
        set((state) => ({
          unconfirmedInteractions: state.unconfirmedInteractions.filter(
            (interaction) => interaction.txHash !== txHash,
          ),
        })),
      clear: () => set({unconfirmedInteractions: []}),
    }),
    {
      name: 'interactions',
    },
  ),
)
