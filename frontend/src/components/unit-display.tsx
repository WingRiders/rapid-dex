import type {Unit} from '@meshsdk/core'
import {useTokenMetadata} from '../metadata/queries'
import {UnitImage} from './unit-image'

type UnitDisplayProps = {
  unit: Unit
}

export const UnitDisplay = ({unit}: UnitDisplayProps) => {
  const {metadata, hasRemoteMetadata} = useTokenMetadata(unit)

  return (
    <div className="flex items-center gap-2">
      <UnitImage
        unit={unit}
        metadata={metadata}
        hasRemoteMetadata={hasRemoteMetadata}
      />
      <p>{metadata?.ticker}</p>
    </div>
  )
}
