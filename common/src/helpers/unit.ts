import {POLICY_ID_LENGTH, type Unit} from '@meshsdk/core'

export const LOVELACE_UNIT = 'lovelace' as const

export const isLovelaceUnit = (unit: Unit) => unit === LOVELACE_UNIT

export const parseUnit = (
  unit: Unit,
): [policyId: string, assetName: string] => {
  if (isLovelaceUnit(unit)) return ['', '']

  const policyId = unit.slice(0, POLICY_ID_LENGTH)
  if (policyId.length !== POLICY_ID_LENGTH) {
    throw new Error(`Couldn't parse unit: ${unit}`)
  }

  const assetName = unit.slice(POLICY_ID_LENGTH)

  return [policyId, assetName]
}

export const createUnit = (policyId: string, assetName: string): Unit => {
  if (policyId === '' && assetName === '') return LOVELACE_UNIT

  return `${policyId}${assetName}`
}
