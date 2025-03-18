import type {Unit} from '@meshsdk/core'
import {useTokenMetadata} from '../metadata/queries'
import {UnitImage} from './unit-image'

type UnitPairDisplayProps = {
  unitA: Unit
  unitB: Unit
  imageSize?: number
}

export const UnitPairDisplay = ({
  unitA,
  unitB,
  imageSize,
}: UnitPairDisplayProps) => {
  const {metadata: unitAMetadata, hasRemoteMetadata: hasUnitAMetadata} =
    useTokenMetadata(unitA)
  const {metadata: unitBMetadata, hasRemoteMetadata: hasUnitBMetadata} =
    useTokenMetadata(unitB)

  return (
    <div className="flex flex-row items-center gap-3">
      <div className="flex flex-row">
        <UnitImage
          unit={unitA}
          metadata={unitAMetadata}
          hasRemoteMetadata={hasUnitAMetadata}
          size={imageSize}
        />
        <UnitImage
          unit={unitB}
          metadata={unitBMetadata}
          hasRemoteMetadata={hasUnitBMetadata}
          size={imageSize}
          className="ml-[-4px]"
        />
      </div>

      <p className="text-md">
        {unitAMetadata?.ticker} / {unitBMetadata?.ticker}
      </p>
    </div>
  )
}
