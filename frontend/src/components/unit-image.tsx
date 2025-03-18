import type {Unit} from '@meshsdk/core'
import type {TokenMetadata} from '@wingriders/rapid-dex-common'
import {CircleHelpIcon} from 'lucide-react'
import {config} from '../config'
import {isAda} from '../helpers/asset'

type UnitImageProps = {
  unit: Unit
  metadata: TokenMetadata | undefined
  hasRemoteMetadata: boolean
  size?: number
}

export const UnitImage = ({
  unit,
  metadata,
  hasRemoteMetadata,
  size = 32,
}: UnitImageProps) => {
  const hasImage = hasRemoteMetadata || isAda(unit)

  if (!hasImage)
    return (
      <div
        className="flex items-center justify-center rounded-full bg-gray-700"
        style={{width: size, height: size}}
      >
        <CircleHelpIcon className="size-5 text-gray-300" />
      </div>
    )

  return (
    <img
      key={unit}
      src={`${config.NEXT_PUBLIC_SERVER_URL}/token-image/${unit}`}
      alt={metadata?.ticker ?? metadata?.name ?? 'logo'}
      width={size}
      height={size}
      className="rounded-full"
    />
  )
}
