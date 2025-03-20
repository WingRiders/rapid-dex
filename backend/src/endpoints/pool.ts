import type {Asset, UTxO} from '@meshsdk/core'
import {
  LOVELACE_UNIT,
  parseUtxoId,
  poolScriptAddressByNetwork,
} from '@wingriders/rapid-dex-common'
import {config} from '../config'
import {prisma} from '../db/prismaClient'

export const getPoolUtxo = async (shareAssetName: string) => {
  const pool = await prisma.poolOutput.findFirstOrThrow({
    where: {
      spendSlot: null,
      shareAssetName,
    },
    select: {
      utxoId: true,
      assets: true,
      coins: true,
      datumCBOR: true,
    },
  })
  const utxo: UTxO = {
    input: parseUtxoId(pool.utxoId),
    output: {
      address: poolScriptAddressByNetwork[config.NETWORK],
      amount: (pool.assets as Asset[]).concat({
        unit: LOVELACE_UNIT,
        quantity: pool.coins.toString(),
      }),
      plutusData: pool.datumCBOR,
    },
  }

  return utxo
}
