import type {Asset, Unit} from '@meshsdk/core'
import {parseUnit} from '@wingriders/rapid-dex-common'

export const isHumanReadable = (value: string): boolean =>
  !!value && /^[a-zA-Z0-9!"#$%&'()*+,./:;<=>?@[\] ^_`{|}~-]*$/.test(value)

export const decodeAssetName = (assetName: string): string => {
  const decodedAssetName = Buffer.from(assetName, 'hex').toString()
  return isHumanReadable(decodedAssetName) ? decodedAssetName : assetName
}

export const compareUnits = (a: Unit, b: Unit) => {
  const [policyIdA, assetNameA] = parseUnit(a)
  const [policyIdB, assetNameB] = parseUnit(b)

  return (
    Buffer.from(policyIdA, 'hex').compare(Buffer.from(policyIdB, 'hex')) ||
    Buffer.from(assetNameA, 'hex').compare(Buffer.from(assetNameB, 'hex'))
  )
}

export const sortAssets = (assetX: Asset, assetY: Asset): [Asset, Asset] =>
  compareUnits(assetX.unit, assetY.unit) > 0
    ? [assetY, assetX]
    : [assetX, assetY]
