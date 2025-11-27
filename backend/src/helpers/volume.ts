import {PoolInteractionType, type PoolOutput} from '@prisma/client'
import {FeeFrom} from '@wingriders/rapid-dex-common'

type CalculatePoolOutputVolumeArgs = {
  interactionType: PoolInteractionType
  qtyADiff: bigint
  qtyBDiff: bigint
  treasuryADiff: bigint
  treasuryBDiff: bigint
  feeFrom: FeeFrom
}

export const calculatePoolOutputVolume = ({
  interactionType,
  qtyADiff,
  qtyBDiff,
  treasuryADiff,
  treasuryBDiff,
  feeFrom,
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

  // "Output volume" = amount received by non-pool UTxOs.
  // Pool diffs (qty*Diff) include treasury portions; plain qty* do not.
  // When fees were taken from the input token, we explicitly add treasury*Diff
  // so volumes reflect the full user-side movement.
  return {
    ...(aToB
      ? [FeeFrom.TokenA, FeeFrom.InputToken].includes(feeFrom)
        ? {
            // Treasury fee was taken from A, qtyADiff is positive, but pool UTxO might have received more - part if it was added to treasury.
            // We want to include that part in the volume, so we need to add it explicitly.
            volumeA: qtyADiff + treasuryADiff,
            volumeB: 0n,
            outputVolumeA: 0n,
            outputVolumeB: -qtyBDiff,
          }
        : {
            volumeA: qtyADiff,
            volumeB: 0n,
            outputVolumeA: 0n,
            // Treasury fee was taken from B, qtyBDiff is negative, but pool UTxO might have been reduced by less - part of it was added to treasury.
            // We want to include that part in the volume.
            // Although qtyB excludes treasury, qtyBDiff includes this "treasury exclusion".
            outputVolumeB: -qtyBDiff,
          }
      : [FeeFrom.TokenB, FeeFrom.InputToken].includes(feeFrom)
        ? {
            volumeA: 0n,
            // Treasury fee was taken from B, qtyBDiff is positive, but pool UTxO might have received more - part if it was added to treasury.
            // We want to include that part in the volume, so we need to add it explicitly.
            volumeB: qtyBDiff + treasuryBDiff,
            outputVolumeA: -qtyADiff,
            outputVolumeB: 0n,
          }
        : {
            volumeA: 0n,
            volumeB: qtyBDiff,
            // Treasury fee was taken from A, qtyADiff is negative, but pool UTxO might have been reduced by less - part of it was added to treasury.
            // We want to include that part in the volume.
            // Although qtyA excludes treasury, qtyADiff includes this "treasury exclusion".
            outputVolumeA: -qtyADiff,
            outputVolumeB: 0n,
          }),
  }
}
