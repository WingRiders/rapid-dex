'use client'

import {POLICY_ID_LENGTH} from '@meshsdk/core'
import {useQueryClient} from '@tanstack/react-query'
import {
  FeeFrom,
  isLovelaceUnit,
  LOVELACE_UNIT,
  poolOil,
} from '@wingriders/rapid-dex-common'
import {
  type BuildCreatePoolTxArgs,
  computeSharesCreatePool,
  encodeFee,
  leastCommonMultiple,
  sortUnits,
} from '@wingriders/rapid-dex-sdk-core'
import {usePoolsQuery, useTRPC} from '@wingriders/rapid-dex-sdk-react'
import BigNumber from 'bignumber.js'
import {ArrowLeftIcon} from 'lucide-react'
import {useRouter} from 'next/navigation'
import pluralize from 'pluralize'
import {useEffect, useMemo} from 'react'
import {Controller, useForm} from 'react-hook-form'
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {Checkbox} from '@/components/ui/checkbox'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field'
import {Input} from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import {useValidateCreatePoolForm, validateFeePercentage} from './helpers'
import type {CreatePoolFormInputs} from './types'

const DEFAULT_FEE_FROM = FeeFrom.InputToken
const DEFAULT_FEE_PERCENTAGE = 0.2

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
    register,
    watch,
    reset: resetForm,
    formState: {isValid: isFormValid, errors, isValidating},
  } = useForm<CreatePoolFormInputs>({
    defaultValues: {
      assetX: EMPTY_ASSET_INPUT_VALUE,
      assetY: EMPTY_ASSET_INPUT_VALUE,
      feeFrom: DEFAULT_FEE_FROM,
      useBidirectionalSwapFee: false,
      swapFeePercentageAToB: DEFAULT_FEE_PERCENTAGE,
      swapFeePercentageBToA: DEFAULT_FEE_PERCENTAGE,
      enableTreasury: false,
      useBidirectionalTreasuryFee: false,
      treasuryFeePercentageAToB: DEFAULT_FEE_PERCENTAGE,
      treasuryFeePercentageBToA: DEFAULT_FEE_PERCENTAGE,
      treasuryAuthorityUnit: '',
    },
    disabled: isSigningAndSubmittingTx,
    mode: 'onChange',
  })

  const isValid = isFormValid && !isValidating

  const inputs = watch()

  const {
    assetX,
    assetY,
    feeFrom,
    useBidirectionalSwapFee,
    swapFeePercentageAToB,
    swapFeePercentageBToA,
    enableTreasury,
    useBidirectionalTreasuryFee,
    treasuryFeePercentageAToB,
    treasuryFeePercentageBToA,
    treasuryAuthorityUnit,
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

  const customValidationError = useValidateCreatePoolForm({
    inputs,
    earnedShares,
  })
  const isCustomValidationOk = customValidationError == null

  const seed = utxos?.[0]

  const buildCreatePoolTxArgs = useMemo(() => {
    if (
      !isValid ||
      !isCustomValidationOk ||
      !isAssetInputValueNonEmpty(assetX) ||
      !isAssetInputValueNonEmpty(assetY) ||
      swapFeePercentageAToB == null ||
      (useBidirectionalSwapFee &&
        (!swapFeePercentageBToA || swapFeePercentageBToA === 0)) ||
      earnedShares == null ||
      !connectedWallet ||
      !seed
    )
      return undefined

    const encodedSwapFeeAToB = encodeFee(
      new BigNumber(swapFeePercentageAToB).div(100),
    )

    const encodedSwapFeeBToA = useBidirectionalSwapFee
      ? encodeFee(new BigNumber(swapFeePercentageBToA).div(100))
      : encodedSwapFeeAToB

    const encodedTreasuryFeeAToB = encodeFee(
      enableTreasury
        ? new BigNumber(treasuryFeePercentageAToB).div(100)
        : new BigNumber(0),
    )

    const encodedTreasuryFeeBToA = encodeFee(
      enableTreasury
        ? new BigNumber(
            useBidirectionalTreasuryFee
              ? treasuryFeePercentageBToA
              : treasuryFeePercentageAToB,
          ).div(100)
        : new BigNumber(0),
    )

    const feeBasis = leastCommonMultiple(
      encodedSwapFeeAToB.feeBasis,
      encodedSwapFeeBToA.feeBasis,
      encodedTreasuryFeeAToB.feeBasis,
      encodedTreasuryFeeBToA.feeBasis,
    )

    const args: Omit<BuildCreatePoolTxArgs, 'wallet'> = {
      assetX: assetInputValueToAsset(assetX),
      assetY: assetInputValueToAsset(assetY),
      outShares: earnedShares,
      seed: {
        txHash: seed.input.txHash,
        txIndex: seed.input.outputIndex,
      },
      feeBasis,
      feeFrom,
      treasuryAuthorityUnit: treasuryAuthorityUnit,
      treasuryFeePointsAToB:
        (encodedTreasuryFeeAToB.feePoints * feeBasis) /
        encodedTreasuryFeeAToB.feeBasis,
      treasuryFeePointsBToA:
        (encodedTreasuryFeeBToA.feePoints * feeBasis) /
        encodedTreasuryFeeBToA.feeBasis,
      swapFeePointsAToB:
        (encodedSwapFeeAToB.feePoints * feeBasis) / encodedSwapFeeAToB.feeBasis,
      swapFeePointsBToA:
        (encodedSwapFeeBToA.feePoints * feeBasis) / encodedSwapFeeBToA.feeBasis,
    }

    return args
  }, [
    assetX,
    assetY,
    earnedShares,
    connectedWallet,
    seed,
    feeFrom,
    isCustomValidationOk,
    isValid,
    swapFeePercentageAToB,
    swapFeePercentageBToA,
    useBidirectionalSwapFee,
    enableTreasury,
    treasuryAuthorityUnit,
    treasuryFeePercentageAToB,
    treasuryFeePercentageBToA,
    useBidirectionalTreasuryFee,
  ])

  const {
    data: buildCreatePoolTxResult,
    isLoading: isLoadingBuildTx,
    error: buildCreatePoolTxError,
  } = useBuildCreatePoolTxQuery(buildCreatePoolTxArgs)

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

        <div className="mt-6">
          <Field orientation="horizontal">
            <FieldContent>
              <FieldLabel htmlFor="fee-from">Take fees from</FieldLabel>
              <FieldDescription>
                Choose which token are the fees deducted from. This applies to
                both swap and treasury fees.
              </FieldDescription>
            </FieldContent>

            <Controller
              control={control}
              name="feeFrom"
              render={({field}) => (
                <Select {...field} onValueChange={field.onChange}>
                  <SelectTrigger id="fee-from" className="w-[180px]">
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
          </Field>
        </div>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Swap fees configuration</CardTitle>
            <CardDescription>
              Set the trading fee charged on swaps. Fees are automatically added
              to the pool to reward liquidity providers.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Field>
                <FieldLabel htmlFor="swap-fee-percentage-a-to-b">
                  {!useBidirectionalSwapFee
                    ? 'Swap fee (%)'
                    : `Swap fee ${
                        unitA != null && unitB != null
                          ? `${unitATicker} → ${unitBTicker}`
                          : 'A → B'
                      }`}
                </FieldLabel>
                <FieldContent>
                  <Input
                    {...register('swapFeePercentageAToB', {
                      validate: validateFeePercentage,
                    })}
                    id="swap-fee-percentage-a-to-b"
                    type="number"
                  />
                </FieldContent>
                <FieldError errors={[errors.swapFeePercentageAToB]} />
              </Field>

              {inputs.useBidirectionalSwapFee && (
                <Field className="mt-4">
                  <FieldLabel htmlFor="swap-fee-percentage-b-to-a">
                    Swap fee{' '}
                    {unitA != null && unitB != null
                      ? `${unitBTicker} → ${unitATicker}`
                      : 'B → A'}{' '}
                    (%)
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      {...register('swapFeePercentageBToA', {
                        validate: (value, formValues) => {
                          if (!formValues.useBidirectionalSwapFee)
                            return undefined

                          return validateFeePercentage(value)
                        },
                      })}
                      id="swap-fee-percentage-b-to-a"
                      type="number"
                    />
                  </FieldContent>
                  <FieldError errors={[errors.swapFeePercentageBToA]} />
                </Field>
              )}
            </div>

            <Field orientation="horizontal">
              <Controller
                control={control}
                name="useBidirectionalSwapFee"
                rules={{deps: ['swapFeePercentageBToA']}}
                render={({field: {value, onChange}}) => (
                  <Checkbox
                    id="use-bidirectional-swap-fee"
                    checked={value}
                    onCheckedChange={(checked) => {
                      onChange(checked === true)
                    }}
                  />
                )}
              />

              <FieldContent>
                <FieldLabel htmlFor="use-bidirectional-swap-fee">
                  Use different fees per direction
                </FieldLabel>
                <FieldDescription>
                  Enable to set separate fees for{' '}
                  {unitA != null && unitB != null
                    ? `${unitATicker}→${unitBTicker}`
                    : 'A→B'}{' '}
                  and{' '}
                  {unitA != null && unitB != null
                    ? `${unitBTicker}→${unitATicker}`
                    : 'B→A'}{' '}
                  swaps
                </FieldDescription>
              </FieldContent>
            </Field>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Treasury configuration</CardTitle>
            <CardDescription>
              Configure the treasury fees that are charged on swaps. Accumulated
              treasury can be withdrawn by the selected authority.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Field orientation="horizontal">
              <Controller
                control={control}
                name="enableTreasury"
                render={({field: {value, onChange}}) => (
                  <Checkbox
                    id="enable-treasury"
                    checked={value}
                    onCheckedChange={(checked) => onChange(checked === true)}
                  />
                )}
                rules={{
                  deps: [
                    'treasuryFeePercentageAToB',
                    'treasuryFeePercentageBToA',
                  ],
                }}
              />
              <FieldLabel htmlFor="enable-treasury">Enable treasury</FieldLabel>
            </Field>

            {enableTreasury && (
              <>
                <div className="space-y-4">
                  <Field>
                    <FieldLabel htmlFor="treasury-fee-percentage-a-to-b">
                      Treasury fee{' '}
                      {unitA != null && unitB != null
                        ? `${unitATicker} → ${unitBTicker}`
                        : 'A → B'}{' '}
                      (%)
                    </FieldLabel>
                    <FieldContent>
                      <Input
                        {...register('treasuryFeePercentageAToB', {
                          validate: validateFeePercentage,
                        })}
                        id="treasury-fee-percentage-a-to-b"
                        type="number"
                      />
                    </FieldContent>
                    <FieldError errors={[errors.treasuryFeePercentageAToB]} />
                  </Field>

                  {useBidirectionalTreasuryFee && (
                    <Field>
                      <FieldLabel htmlFor="treasury-fee-percentage-b-to-a">
                        Treasury fee{' '}
                        {unitA != null && unitB != null
                          ? `${unitBTicker} → ${unitATicker}`
                          : 'B → A'}{' '}
                        (%)
                      </FieldLabel>
                      <FieldContent>
                        <Input
                          {...register('treasuryFeePercentageBToA', {
                            validate: (value, formValues) => {
                              if (!formValues.useBidirectionalTreasuryFee)
                                return undefined

                              return validateFeePercentage(value)
                            },
                          })}
                          id="treasury-fee-percentage-b-to-a"
                          type="number"
                        />
                      </FieldContent>
                      <FieldError errors={[errors.treasuryFeePercentageBToA]} />
                    </Field>
                  )}
                </div>

                <Field orientation="horizontal">
                  <Controller
                    control={control}
                    name="useBidirectionalTreasuryFee"
                    render={({field: {value, onChange}}) => (
                      <Checkbox
                        id="use-bidirectional-treasury-fee"
                        checked={value}
                        onCheckedChange={(checked) =>
                          onChange(checked === true)
                        }
                      />
                    )}
                    rules={{deps: ['treasuryFeePercentageBToA']}}
                  />
                  <FieldContent>
                    <FieldLabel htmlFor="use-bidirectional-treasury-fee">
                      Use different fees per direction
                    </FieldLabel>
                    <FieldDescription>
                      Enable to set separate fees for{' '}
                      {unitA != null && unitB != null
                        ? `${unitATicker}→${unitBTicker}`
                        : 'A→B'}{' '}
                      and{' '}
                      {unitA != null && unitB != null
                        ? `${unitBTicker}→${unitATicker}`
                        : 'B→A'}{' '}
                      treasury fees
                    </FieldDescription>
                  </FieldContent>
                </Field>

                <Field>
                  <FieldLabel htmlFor="authority-unit">
                    Authority unit
                  </FieldLabel>
                  <FieldDescription>
                    Enter the policy ID and asset name (in HEX format) of the
                    token required to authorize treasury withdrawals. Only
                    wallets holding this token can withdraw the accumulated fees
                    from the treasury.
                  </FieldDescription>
                  <FieldContent>
                    <Controller
                      control={control}
                      name="treasuryAuthorityUnit"
                      render={({field}) => (
                        <Input
                          {...field}
                          id="authority-unit"
                          type="text"
                          placeholder="a1b2c3d4e5f6..."
                        />
                      )}
                      rules={{
                        required: 'Enter authority unit',
                        pattern: {
                          value: /^[0-9a-fA-F]+$/,
                          message: 'Invalid policy ID and asset name',
                        },
                        minLength: {
                          value: POLICY_ID_LENGTH,
                          message: 'Invalid policy ID and asset name',
                        },
                      }}
                    />
                  </FieldContent>
                  <FieldError errors={[errors.treasuryAuthorityUnit]} />
                </Field>
              </>
            )}
          </CardContent>
        </Card>

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
                  !isCustomValidationOk ||
                  !buildCreatePoolTxResult ||
                  isSigningAndSubmittingTx
                }
                onClick={handleCreatePool}
              >
                Create pool
              </Button>
            </div>
          </TooltipTrigger>
          {customValidationError && (
            <TooltipContent>{customValidationError}</TooltipContent>
          )}
        </Tooltip>

        {poolsWithSamePair && poolsWithSamePair.length > 0 && (
          <Alert className="mt-4">
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

export default CreatePoolPage
