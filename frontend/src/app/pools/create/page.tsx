'use client'

import {useQueryClient} from '@tanstack/react-query'
import {
  FeeFrom,
  isLovelaceUnit,
  LOVELACE_UNIT,
  poolOil,
} from '@wingriders/rapid-dex-common'
import {
  computeSharesCreatePool,
  encodeFee,
  sortUnits,
} from '@wingriders/rapid-dex-sdk-core'
import {usePoolsQuery, useTRPC} from '@wingriders/rapid-dex-sdk-react'
import BigNumber from 'bignumber.js'
import {ArrowLeftIcon} from 'lucide-react'
import {useRouter} from 'next/navigation'
import pluralize from 'pluralize'
import {useEffect, useMemo} from 'react'
import {Controller, useForm} from 'react-hook-form'
import {NumericFormat} from 'react-number-format'
import {AssetQuantity} from '@//components/asset-quantity'
import {DataRows} from '@//components/data-rows'
import {TxSubmittedDialog} from '@//components/tx-submitted-dialog'
import {Tooltip, TooltipContent, TooltipTrigger} from '@//components/ui/tooltip'
import {formatBigNumber} from '@//helpers/format-number'
import {AssetInput} from '@/components/asset-input/asset-input'
import {EMPTY_ASSET_INPUT_VALUE} from '@/components/asset-input/constants'
import {
  assetInputValueToAsset,
  isAssetInputValueNonEmpty,
} from '@/components/asset-input/helpers'
import type {AssetInputItem} from '@/components/asset-input/types'
import {ErrorAlert} from '@/components/error-alert'
import {PageContainer} from '@/components/page-container'
import {SwapFeeDisplay} from '@/components/swap-fee-display'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {Alert, AlertTitle} from '@/components/ui/alert'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {DECIMAL_SEPARATOR, THOUSAND_SEPARATOR} from '@/constants'
import {
  invalidateDailyActiveUsersQuery,
  invalidateTotalTvlQuery,
} from '@/helpers/invalidation'
import {matchPoolForUnits} from '@/helpers/pool'
import {transformQuantityToNewUnitDecimals} from '@/metadata/helpers'
import {useTokenMetadata} from '@/metadata/queries'
import {useBuildCreatePoolTxQuery} from '@/on-chain/transaction/queries'
import {useConnectedWalletStore} from '@/store/connected-wallet'
import {getTxSendErrorMessage, getTxSignErrorMessage} from '@/wallet/errors'
import {
  invalidateWalletQueries,
  useSignAndSubmitTxMutation,
  useWalletBalanceQuery,
  useWalletUtxosQuery,
} from '@/wallet/queries'
import {useValidateCreatePoolForm} from './helpers'
import type {CreatePoolFormInputs} from './types'

const DEFAULT_FEE_FROM = FeeFrom.InputToken
const DEFAULT_SWAP_FEE_PERCENTAGE = 0.2
const FEE_MAX_DECIMALS = 5

const CreatePoolPage = () => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const router = useRouter()

  const {data: pools} = usePoolsQuery()

  const {data: balance} = useWalletBalanceQuery()
  const {data: utxos} = useWalletUtxosQuery()
  const connectedWallet = useConnectedWalletStore(
    (state) => state.connectedWallet,
  )

  const {
    signAndSubmitTx,
    signTxMutationResult,
    submitTxMutationResult,
    isPending: isSigningAndSubmittingTx,
    isError: isSignAndSubmitTxError,
    reset: resetSignAndSubmitTx,
  } = useSignAndSubmitTxMutation()

  const {
    control,
    watch,
    reset: resetForm,
  } = useForm<CreatePoolFormInputs>({
    defaultValues: {
      assetX: EMPTY_ASSET_INPUT_VALUE,
      assetY: EMPTY_ASSET_INPUT_VALUE,
      feeFrom: DEFAULT_FEE_FROM,
      swapFeePercentageAToB: DEFAULT_SWAP_FEE_PERCENTAGE,
      swapFeePercentageBToA: DEFAULT_SWAP_FEE_PERCENTAGE,
    },
    disabled: isSigningAndSubmittingTx,
  })

  const inputs = watch()
  const {
    assetX,
    assetY,
    swapFeePercentageAToB,
    swapFeePercentageBToA,
    feeFrom,
  } = inputs

  const [unitA, unitB] =
    assetX.unit != null && assetY.unit != null
      ? sortUnits(assetX.unit, assetY.unit)
      : [null, null]

  const {metadata: unitAMetadata} = useTokenMetadata(unitA)
  const {metadata: unitBMetadata} = useTokenMetadata(unitB)

  const unitATicker = unitAMetadata?.ticker ?? unitAMetadata?.name ?? 'unknown'
  const unitBTicker = unitBMetadata?.ticker ?? unitBMetadata?.name ?? 'unknown'

  const earnedShares = useMemo(() => {
    if (!assetX.quantity || !assetY.quantity) return undefined
    return computeSharesCreatePool({
      lockX: assetX.quantity,
      lockY: assetY.quantity,
    })
  }, [assetX.quantity, assetY.quantity])

  const validationError = useValidateCreatePoolForm({inputs, earnedShares})
  const isValid = validationError == null

  const seed = utxos?.[0]

  const encodedSwapFeeAToB =
    swapFeePercentageAToB != null
      ? encodeFee(new BigNumber(swapFeePercentageAToB).div(100))
      : undefined

  const encodedSwapFeeBToA =
    swapFeePercentageBToA != null
      ? encodeFee(new BigNumber(swapFeePercentageBToA).div(100))
      : undefined

  const {
    data: buildCreatePoolTxResult,
    isLoading: isLoadingBuildTx,
    error: buildCreatePoolTxError,
  } = useBuildCreatePoolTxQuery(
    isValid &&
      isAssetInputValueNonEmpty(assetX) &&
      isAssetInputValueNonEmpty(assetY) &&
      earnedShares != null &&
      connectedWallet &&
      seed &&
      encodedSwapFeeAToB &&
      encodedSwapFeeBToA
      ? {
          assetX: assetInputValueToAsset(assetX),
          assetY: assetInputValueToAsset(assetY),
          outShares: earnedShares,
          seed: {
            txHash: seed.input.txHash,
            txIndex: seed.input.outputIndex,
          },
          feeBasis:
            encodedSwapFeeAToB.feeBasis === encodedSwapFeeBToA.feeBasis
              ? encodedSwapFeeAToB.feeBasis
              : encodedSwapFeeAToB.feeBasis * encodedSwapFeeBToA.feeBasis,
          feeFrom,
          swapFeePointsAToB:
            encodedSwapFeeAToB.feeBasis === encodedSwapFeeBToA.feeBasis
              ? encodedSwapFeeAToB.feePoints
              : encodedSwapFeeAToB.feePoints * encodedSwapFeeBToA.feeBasis,
          swapFeePointsBToA:
            encodedSwapFeeAToB.feeBasis === encodedSwapFeeBToA.feeBasis
              ? encodedSwapFeeBToA.feePoints
              : encodedSwapFeeBToA.feePoints * encodedSwapFeeAToB.feeBasis,
        }
      : undefined,
  )

  // biome-ignore lint/correctness/useExhaustiveDependencies: Reset the error state of the sign and submit tx when the build tx result is updated
  useEffect(() => {
    if (isSignAndSubmitTxError) resetSignAndSubmitTx()
  }, [buildCreatePoolTxResult, resetSignAndSubmitTx])

  const assetInputItems = useMemo(
    () =>
      balance
        ? Object.entries(balance)
            .map<AssetInputItem>(([unit, balance]) => ({
              unit,
              balance,
            }))
            .sort((a, b) => {
              const isAdaA = isLovelaceUnit(a.unit)
              const isAdaB = isLovelaceUnit(b.unit)

              if (isAdaA && !isAdaB) return -1
              if (!isAdaA && isAdaB) return 1

              return b.balance.comparedTo(a.balance)
            })
        : null,
    [balance],
  )

  const poolsWithSamePair = useMemo(
    () =>
      assetX.unit && assetY.unit
        ? pools?.filter(matchPoolForUnits(assetX.unit, assetY.unit))
        : undefined,
    [pools, assetX.unit, assetY.unit],
  )

  const handleCreatePool = async () => {
    if (!buildCreatePoolTxResult) return
    const res = await signAndSubmitTx(buildCreatePoolTxResult.builtTx, true)
    if (res) {
      invalidateWalletQueries(queryClient)
      invalidateTotalTvlQuery(trpc, queryClient)
      invalidateDailyActiveUsersQuery(trpc, queryClient)
    }
  }

  const handleTxSubmittedDialogOpenChange = (open: boolean) => {
    if (!open) {
      resetSignAndSubmitTx()
      resetForm()
    }
  }

  const noAssetInputItemsMessage = 'Connect your wallet'
  const emptyAssetInputItemsMessage = 'No assets found'

  return (
    <>
      <PageContainer width="small">
        <div className="flex flex-row flex-wrap items-center gap-3">
          <Button
            variant="outline"
            onClick={() => router.push('/pools')}
            size="sm"
          >
            <ArrowLeftIcon />
            Pools
          </Button>
          <h2 className="font-bold text-2xl">Create new liquidity pool</h2>
        </div>

        <div className="mt-4 flex flex-col gap-1">
          <Controller
            control={control}
            name="assetX"
            render={({field}) => (
              <AssetInput
                items={assetInputItems}
                {...field}
                onChange={(value) => {
                  const newValue = {...value}
                  if (value.quantity && value.unit !== assetX.unit) {
                    newValue.quantity = transformQuantityToNewUnitDecimals(
                      value.quantity,
                      assetX.unit,
                      value.unit,
                      trpc,
                      queryClient,
                    )
                  }
                  field.onChange(newValue)
                }}
                noItemsMessage={noAssetInputItemsMessage}
                emptyItemsMessage={emptyAssetInputItemsMessage}
                showMaxButton
              />
            )}
          />

          <Controller
            control={control}
            name="assetY"
            render={({field}) => (
              <AssetInput
                items={assetInputItems}
                {...field}
                onChange={(value) => {
                  const newValue = {...value}
                  if (value.quantity && value.unit !== assetY.unit) {
                    newValue.quantity = transformQuantityToNewUnitDecimals(
                      value.quantity,
                      assetY.unit,
                      value.unit,
                      trpc,
                      queryClient,
                    )
                  }
                  field.onChange(newValue)
                }}
                noItemsMessage={noAssetInputItemsMessage}
                emptyItemsMessage={emptyAssetInputItemsMessage}
                showMaxButton
              />
            )}
          />
        </div>

        <div className="wrap mt-2 flex flex-row items-center justify-between gap-2">
          <p className="flex-3">Take swap fee from</p>
          <Controller
            control={control}
            name="feeFrom"
            render={({field}) => (
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={field.disabled}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select fee option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={FeeFrom.InputToken}>
                    Input token
                  </SelectItem>
                  <SelectItem value={FeeFrom.OutputToken}>
                    Output token
                  </SelectItem>
                  <SelectItem value={FeeFrom.TokenA}>
                    {unitA != null && unitB != null
                      ? `Always ${unitATicker}`
                      : 'Token A'}
                  </SelectItem>
                  <SelectItem value={FeeFrom.TokenB}>
                    {unitA != null && unitB != null
                      ? `Always ${unitBTicker}`
                      : 'Token B'}
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="wrap mt-2 flex flex-row items-center justify-between gap-2">
          <p className="flex-3">
            {unitA != null && unitB != null
              ? `Swap fee ${unitATicker} to ${unitBTicker}`
              : 'Swap fee A to B'}
          </p>
          <Controller
            control={control}
            name="swapFeePercentageAToB"
            render={({field}) => (
              <SwapFeePercentageInput
                value={field.value}
                onChange={field.onChange}
                disabled={field.disabled}
              />
            )}
          />
        </div>

        <div className="wrap mt-2 flex flex-row items-center justify-between gap-2">
          <p className="flex-3">
            {unitA != null && unitB != null
              ? `Swap fee ${unitBTicker} to ${unitATicker}`
              : 'Swap fee B to A'}
          </p>
          <Controller
            control={control}
            name="swapFeePercentageBToA"
            render={({field}) => (
              <SwapFeePercentageInput
                value={field.value}
                onChange={field.onChange}
                disabled={field.disabled}
              />
            )}
          />
        </div>

        <Tooltip>
          <TooltipTrigger
            className="mt-4 w-full"
            disabled={isLoadingBuildTx || isSigningAndSubmittingTx}
            asChild
          >
            <div>
              <Button
                size="lg"
                className="w-full"
                loading={isLoadingBuildTx || isSigningAndSubmittingTx}
                disabled={
                  isLoadingBuildTx ||
                  !isValid ||
                  !buildCreatePoolTxResult ||
                  isSigningAndSubmittingTx
                }
                onClick={handleCreatePool}
              >
                Create pool
              </Button>
            </div>
          </TooltipTrigger>
          {validationError && (
            <TooltipContent>{validationError}</TooltipContent>
          )}
        </Tooltip>

        {poolsWithSamePair && poolsWithSamePair.length > 0 && (
          <Alert className="mt-2">
            <AlertTitle>
              <Accordion type="single" collapsible>
                <AccordionItem value="pools-with-same-pair">
                  <AccordionTrigger className="py-2">
                    There {poolsWithSamePair.length === 1 ? 'is' : 'are'}{' '}
                    already {poolsWithSamePair.length}{' '}
                    {pluralize('pool', poolsWithSamePair.length)} created with
                    this pair
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="flex flex-col gap-1">
                      {poolsWithSamePair.map((pool) => (
                        <div
                          key={pool.shareAssetName}
                          className="rounded-md border border-input p-2"
                        >
                          <DataRows
                            rows={[
                              {
                                label: 'Pool reserves',
                                value: (
                                  <div className="flex flex-col items-end gap-1">
                                    <p className="text-right">
                                      <AssetQuantity
                                        unit={pool.unitA}
                                        quantity={pool.poolState.qtyA}
                                      />
                                    </p>
                                    <p className="text-right">
                                      <AssetQuantity
                                        unit={pool.unitB}
                                        quantity={pool.poolState.qtyB}
                                      />
                                    </p>
                                  </div>
                                ),
                              },
                              {
                                label: 'Swap fee',
                                value: (
                                  <p>
                                    <SwapFeeDisplay
                                      swapFeePointsAToB={pool.swapFeePointsAToB}
                                      swapFeePointsBToA={pool.swapFeePointsBToA}
                                      feeBasis={pool.feeBasis}
                                      feeFrom={pool.feeFrom}
                                      unitA={pool.unitA}
                                      unitB={pool.unitB}
                                    />
                                  </p>
                                ),
                              },
                            ]}
                          />
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </AlertTitle>
          </Alert>
        )}

        {buildCreatePoolTxResult && earnedShares && (
          <DataRows
            className="mt-2"
            rows={[
              {
                label: 'Earned shares',
                value: formatBigNumber(earnedShares),
              },
              {
                label: 'Transaction fee',
                value: (
                  <AssetQuantity
                    unit={LOVELACE_UNIT}
                    quantity={buildCreatePoolTxResult.txFee}
                  />
                ),
              },
              {
                label: 'Pool oil',
                value: (
                  <AssetQuantity unit={LOVELACE_UNIT} quantity={poolOil} />
                ),
              },
            ]}
          />
        )}

        {buildCreatePoolTxError && (
          <ErrorAlert
            title="Error while building transaction"
            description={buildCreatePoolTxError.message}
            className="mt-2"
          />
        )}
        {signTxMutationResult.error && (
          <ErrorAlert
            title="Error while signing transaction"
            description={getTxSignErrorMessage(signTxMutationResult.error)}
            className="mt-2"
          />
        )}
        {submitTxMutationResult.error && (
          <ErrorAlert
            title="Error while submitting transaction"
            description={getTxSendErrorMessage(submitTxMutationResult.error)}
            className="mt-2"
          />
        )}
      </PageContainer>

      <TxSubmittedDialog
        txHash={submitTxMutationResult.data}
        onOpenChange={handleTxSubmittedDialogOpenChange}
      />
    </>
  )
}

type SwapFeePercentageInputProps = {
  value?: number
  onChange: (value: number | undefined) => void
  disabled?: boolean
}

const SwapFeePercentageInput = ({
  value,
  onChange,
  disabled,
}: SwapFeePercentageInputProps) => {
  return (
    <NumericFormat
      customInput={Input}
      thousandSeparator={THOUSAND_SEPARATOR}
      decimalSeparator={DECIMAL_SEPARATOR}
      allowedDecimalSeparators={['.', ',']}
      allowNegative={false}
      decimalScale={FEE_MAX_DECIMALS}
      isAllowed={({value}) => !value || new BigNumber(value).lte(100)}
      type="text"
      placeholder="e.g. 0.2%"
      onValueChange={({value: newValue}, {source}) => {
        if (source === 'prop') return
        const number = Number.parseFloat(newValue)
        onChange(Number.isNaN(number) ? undefined : number)
      }}
      value={value?.toString()}
      suffix="%"
      valueIsNumericString
      autoComplete="off"
      className="flex-1 text-right text-md"
      disabled={disabled}
    />
  )
}

export default CreatePoolPage
