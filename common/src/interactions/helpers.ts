import type {Interaction} from './types'

export const sortInteractions = (a: Interaction, b: Interaction) => {
  if (a.slot == null && b.slot != null) return -1
  if (a.slot != null && b.slot == null) return 1
  return (b.slot ?? 0) - (a.slot ?? 0)
}
