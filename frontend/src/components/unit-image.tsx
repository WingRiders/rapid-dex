import type {Unit} from '@meshsdk/core'
import {isLovelaceUnit, type TokenMetadata} from '@wingriders/rapid-dex-common'
import {CircleHelpIcon} from 'lucide-react'
import {env} from '@/config'
import {cn} from '../lib/utils'

type UnitImageProps = {
  unit: Unit
  metadata: TokenMetadata | undefined
  hasRemoteMetadata: boolean
  size?: number
  className?: string
}

export const UnitImage = ({
  unit,
  metadata,
  hasRemoteMetadata,
  size = 32,
  className,
}: UnitImageProps) => {
  const hasImage = hasRemoteMetadata || isLovelaceUnit(unit)

  if (!hasImage)
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-full bg-gray-700',
          className,
        )}
        style={{width: size, height: size}}
      >
        <CircleHelpIcon className="size-5 text-gray-300" />
      </div>
    )

  return (
    // biome-ignore lint/performance/noImgElement: We don't want to use Next.js Image component here
    <img
      key={unit}
      src={`${env('NEXT_PUBLIC_SERVER_URL')}/token-image/${unit}`}
      alt={metadata?.ticker ?? metadata?.name ?? 'logo'}
      width={size}
      height={size}
      className={cn('rounded-full', className)}
    />
  )
}
