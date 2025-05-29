import {
  type Interaction,
  type InteractionSpecificFields,
  type InteractionSpecificFieldsWithType,
  InteractionType,
  bigintToBigNumber,
  burnedShareTokens,
  createUnit,
  maxShareTokens,
  parseUtxoId,
  sortInteractions,
} from '@wingriders/rapid-dex-common'
import {uniqBy} from 'lodash'
import {
  type PoolOutput as DbPoolOutput,
  PoolInteractionType,
  prisma,
} from '../db/prismaClient'
import {
  type MempoolPoolOutput,
  getMempoolPoolOutputsForPool,
  getMempoolPoolOutputsForStakeKeyHash,
} from '../ogmios/mempoolCache'

export const getUserInteractions = async (
  stakeKeyHash: string,
  onlyUnconfirmed?: boolean,
): Promise<Interaction[]> => {
  const mempoolPoolOutputs = getMempoolPoolOutputsForStakeKeyHash(stakeKeyHash)
  if (onlyUnconfirmed) {
    return poolOutputsToInteractions({mempoolPoolOutputs})
  }

  const dbPoolOutputs = await prisma.poolOutput.findMany({
    where: {createdByStakeKeyHash: stakeKeyHash},
  })

  return poolOutputsToInteractions({dbPoolOutputs, mempoolPoolOutputs})
}

export const getPoolInteractions = async (
  shareAssetName: string,
): Promise<Interaction[]> => {
  const dbPoolOutputs = await prisma.poolOutput.findMany({
    where: {shareAssetName},
  })
  const mempoolPoolOutputs = getMempoolPoolOutputsForPool(shareAssetName)

  return poolOutputsToInteractions({dbPoolOutputs, mempoolPoolOutputs})
}

type RequiredDbPoolOutput = Pick<
  DbPoolOutput,
  | 'utxoId'
  | 'createdByStakeKeyHash'
  | 'interactionType'
  | 'assetAPolicy'
  | 'assetAName'
  | 'assetBPolicy'
  | 'assetBName'
  | 'qtyADiff'
  | 'qtyBDiff'
  | 'lptsDiff'
  | 'shareAssetName'
  | 'slot'
>

type RequiredMempoolPoolOutput = Pick<
  MempoolPoolOutput,
  | 'utxoId'
  | 'createdByStakeKeyHash'
  | 'interactionType'
  | 'assetAPolicy'
  | 'assetAName'
  | 'assetBPolicy'
  | 'assetBName'
  | 'qtyADiff'
  | 'qtyBDiff'
  | 'lptsDiff'
  | 'shareAssetName'
>
type PoolOutput = RequiredDbPoolOutput | RequiredMempoolPoolOutput

const poolOutputsToInteractions = ({
  dbPoolOutputs = [],
  mempoolPoolOutputs = [],
}: {
  dbPoolOutputs?: RequiredDbPoolOutput[]
  mempoolPoolOutputs?: RequiredMempoolPoolOutput[]
}): Interaction[] => {
  const poolOutputs =
    mempoolPoolOutputs.length > 0
      ? uniqBy([...dbPoolOutputs, ...mempoolPoolOutputs], (o) => o.utxoId)
      : dbPoolOutputs

  return poolOutputs.map(poolOutputToInteraction).sort(sortInteractions)
}

export const poolOutputToInteraction = (
  poolOutput: PoolOutput,
): Interaction => {
  const {txHash} = parseUtxoId(poolOutput.utxoId)

  return {
    txHash,
    slot: 'slot' in poolOutput ? poolOutput.slot : undefined,
    pool: {
      shareAssetName: poolOutput.shareAssetName,
      unitA: createUnit(poolOutput.assetAPolicy, poolOutput.assetAName),
      unitB: createUnit(poolOutput.assetBPolicy, poolOutput.assetBName),
    },
    ...getInteractionSpecificFields(poolOutput),
  }
}

const getInteractionType = ({
  interactionType,
}: Pick<DbPoolOutput, 'interactionType'>): InteractionType => {
  switch (interactionType) {
    case PoolInteractionType.Create:
      return InteractionType.CREATE_POOL
    case PoolInteractionType.Swap:
      return InteractionType.SWAP
    case PoolInteractionType.AddLiquidity:
      return InteractionType.ADD_LIQUIDITY
    case PoolInteractionType.WithdrawLiquidity:
      return InteractionType.WITHDRAW_LIQUIDITY
    case PoolInteractionType.Donate:
      return InteractionType.DONATE
  }
}

const getInteractionSpecificFields = (
  poolOutput: PoolOutput,
): InteractionSpecificFieldsWithType => {
  const type = getInteractionType(poolOutput)

  switch (type) {
    case InteractionType.CREATE_POOL:
      return {type, ...getCreatePoolInteractionFields(poolOutput)}
    case InteractionType.SWAP:
      return {type, ...getSwapInteractionFields(poolOutput)}
    case InteractionType.ADD_LIQUIDITY:
      return {type, ...getAddLiquidityInteractionFields(poolOutput)}
    case InteractionType.WITHDRAW_LIQUIDITY:
      return {type, ...getWithdrawLiquidityInteractionFields(poolOutput)}
    case InteractionType.DONATE:
      return {type, ...getDonateInteractionFields(poolOutput)}
  }
}

const getCreatePoolInteractionFields = (
  poolOutput: PoolOutput,
): InteractionSpecificFields[InteractionType.CREATE_POOL] => {
  return {
    qtyA: bigintToBigNumber(poolOutput.qtyADiff),
    qtyB: bigintToBigNumber(poolOutput.qtyBDiff),
    earnedShares: maxShareTokens
      .minus(bigintToBigNumber(poolOutput.lptsDiff))
      .minus(burnedShareTokens),
  }
}

const getSwapInteractionFields = (
  poolOutput: PoolOutput,
): InteractionSpecificFields[InteractionType.SWAP] => {
  const aToB = poolOutput.qtyADiff > 0n
  return {
    aToB,
    lockX: bigintToBigNumber(aToB ? poolOutput.qtyADiff : poolOutput.qtyBDiff),
    outY: bigintToBigNumber(
      aToB ? poolOutput.qtyBDiff : poolOutput.qtyADiff,
    ).negated(),
  }
}

const getAddLiquidityInteractionFields = (
  poolOutput: PoolOutput,
): InteractionSpecificFields[InteractionType.ADD_LIQUIDITY] => {
  return {
    lockA: bigintToBigNumber(poolOutput.qtyADiff),
    lockB: bigintToBigNumber(poolOutput.qtyBDiff),
    earnedShares: bigintToBigNumber(poolOutput.lptsDiff).negated(),
  }
}

const getWithdrawLiquidityInteractionFields = (
  poolOutput: PoolOutput,
): InteractionSpecificFields[InteractionType.WITHDRAW_LIQUIDITY] => {
  return {
    lockShares: bigintToBigNumber(poolOutput.lptsDiff),
    outA: bigintToBigNumber(poolOutput.qtyADiff).negated(),
    outB: bigintToBigNumber(poolOutput.qtyBDiff).negated(),
  }
}

const getDonateInteractionFields = (
  poolOutput: PoolOutput,
): InteractionSpecificFields[InteractionType.DONATE] => {
  return {
    donatedA: bigintToBigNumber(poolOutput.qtyADiff),
    donatedB: bigintToBigNumber(poolOutput.qtyBDiff),
  }
}
