import type {Value} from '@cardano-ogmios/schema'
import type {Asset} from '@meshsdk/core'
import {createUnit, LOVELACE_UNIT} from '@wingriders/rapid-dex-common'
import {flatMap, map} from 'lodash'

export const ogmiosValueToMeshAssets = (
  value: Value,
  {
    includeAda = false,
    includeZero = false,
  }: {includeAda?: boolean; includeZero?: boolean} = {},
): Asset[] =>
  flatMap(value, (byAsset, policyId) =>
    policyId === 'ada' && !includeAda
      ? []
      : map(byAsset, (quantity, assetName) => ({
          unit:
            policyId === 'ada'
              ? LOVELACE_UNIT
              : createUnit(policyId, assetName),
          quantity: quantity.toString(),
        })),
  ).filter((token) => includeZero || token.quantity !== '0')
