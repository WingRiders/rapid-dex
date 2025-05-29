import {PoolInteractionType, type PoolOutput} from '@prisma/client'

type CalculatePoolOutputVolumeArgs = {
  interactionType: PoolInteractionType
  qtyADiff: bigint
  qtyBDiff: bigint
}

export const calculatePoolOutputVolume = ({
  interactionType,
  qtyADiff,
  qtyBDiff,
}: CalculatePoolOutputVolumeArgs): Pick<
  PoolOutput,
  'volumeA' | 'volumeB' | 'outputVolumeA' | 'outputVolumeB'
> => {
  if (interactionType !== PoolInteractionType.Swap) {
    return {
      volumeA: 0n,
      volumeB: 0n,
      outputVolumeA: 0n,
      outputVolumeB: 0n,
    }
  }

  const aToB = qtyADiff > 0n

  return {
    ...(aToB
      ? {
          volumeA: qtyADiff,
          volumeB: 0n,
          outputVolumeA: 0n,
          outputVolumeB: -qtyBDiff,
        }
      : {
          volumeA: 0n,
          volumeB: qtyBDiff,
          outputVolumeA: -qtyADiff,
          outputVolumeB: 0n,
        }),
  }
}
