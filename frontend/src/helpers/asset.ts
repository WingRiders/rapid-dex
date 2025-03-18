import type {Asset, Unit} from '@meshsdk/core'
import {LOVELACE_UNIT} from '../constants'

export const POLICY_ID_SIZE = 28 // bytes

export const isAda = (unit: Unit) => unit === LOVELACE_UNIT

export const isHumanReadable = (value: string): boolean =>
  !!value && /^[a-zA-Z0-9!"#$%&'()*+,./:;<=>?@[\] ^_`{|}~-]*$/.test(value)

export const decodeAssetName = (assetName: string): string => {
  const decodedAssetName = Buffer.from(assetName, 'hex').toString()
  return isHumanReadable(decodedAssetName) ? decodedAssetName : assetName
}

export const decodeUnit = (
  unit: Unit,
): [policyId: string, assetName: string] => {
  if (isAda(unit)) return ['', '']

  const policyIdBuffer = Buffer.from(unit, 'hex').subarray(0, POLICY_ID_SIZE)
  const policyId = policyIdBuffer.toString('hex')
  const assetName = unit.slice(policyId.length)

  if (policyIdBuffer.length !== POLICY_ID_SIZE) {
    throw new Error(`Couldn't decode unit: ${unit}`)
  }

  return [policyId, assetName]
}

export const createUnit = (policyId: string, assetName: string): Unit => {
  if (policyId === '' && assetName === '') return LOVELACE_UNIT

  return `${policyId}${assetName}`
}

export const compareUnits = (a: Unit, b: Unit) => {
  const [policyIdA, assetNameA] = decodeUnit(a)
  const [policyIdB, assetNameB] = decodeUnit(b)

  return (
    Buffer.from(policyIdA, 'hex').compare(Buffer.from(policyIdB, 'hex')) ||
    Buffer.from(assetNameA, 'hex').compare(Buffer.from(assetNameB, 'hex'))
  )
}

export const sortAssets = (assetX: Asset, assetY: Asset): [Asset, Asset] =>
  compareUnits(assetX.unit, assetY.unit) > 0
    ? [assetY, assetX]
    : [assetX, assetY]
