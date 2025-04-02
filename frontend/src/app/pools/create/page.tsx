'use client'

import {computeSharesCreatePool} from '@//amm/create-pool'
import {AssetQuantity} from '@//components/asset-quantity'
import {DataRows} from '@//components/data-rows'
import {TxSubmittedDialog} from '@//components/tx-submitted-dialog'
import {Tooltip, TooltipContent, TooltipTrigger} from '@//components/ui/tooltip'
import {formatBigNumber} from '@//helpers/format-number'
import {useTRPC} from '@//trpc/client'
import {AssetInput} from '@/components/asset-input/asset-input'
import {EMPTY_ASSET_INPUT_VALUE} from '@/components/asset-input/constants'
import {
  assetInputValueToAsset,
  isAssetInputValueNonEmpty,
} from '@/components/asset-input/helpers'
import type {AssetInputItem} from '@/components/asset-input/types'
import {ErrorAlert} from '@/components/error-alert'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {Alert, AlertTitle} from '@/components/ui/alert'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {DECIMAL_SEPARATOR, THOUSAND_SEPARATOR} from '@/constants'
import {computeFee, encodeFee} from '@/helpers/fee'
import {formatPercentage} from '@/helpers/format-percentage'
import {matchPoolForUnits, usePoolsQuery} from '@/helpers/pool'
import {transformQuantityToNewUnitDecimals} from '@/metadata/helpers'
import {useBuildCreatePoolTxQuery} from '@/onChain/transaction/queries'
import {useConnectedWalletStore} from '@/store/connected-wallet'
import {useLocalInteractionsStore} from '@/store/local-interactions'
import {getTxSendErrorMessage, getTxSignErrorMessage} from '@/wallet/errors'
import {
  useSignAndSubmitTxMutation,
  useWalletBalanceQuery,
  useWalletUtxosQuery,
} from '@/wallet/queries'
import {useQueryClient} from '@tanstack/react-query'
import {
  LOVELACE_UNIT,
  isLovelaceUnit,
  poolOil,
} from '@wingriders/rapid-dex-common'
import BigNumber from 'bignumber.js'
import {ArrowLeftIcon} from 'lucide-react'
import {useRouter} from 'next/navigation'
import pluralize from 'pluralize'
import {useEffect, useMemo} from 'react'
import {Controller, useForm} from 'react-hook-form'
import {NumericFormat} from 'react-number-format'
import {useValidateCreatePoolForm} from './helpers'
import type {CreatePoolFormInputs} from './types'

const DEFAULT_SWAP_FEE_PERCENTAGE = 0.2
const FEE_MAX_DECIMALS = 5

const CreatePoolPage = () => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const router = useRouter()

  const addUnconfirmedInteraction = useLocalInteractionsStore(
    (state) => state.addUnconfirmedInteraction,
  )

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
      swapFeePercentage: DEFAULT_SWAP_FEE_PERCENTAGE,
    },
    disabled: isSigningAndSubmittingTx,
  })

  const inputs = watch()
  const {assetX, assetY, swapFeePercentage} = inputs

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

  const encodedSwapFee =
    swapFeePercentage != null
      ? encodeFee(new BigNumber(swapFeePercentage).div(100))
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
      encodedSwapFee
      ? {
          assetX: assetInputValueToAsset(assetX),
          assetY: assetInputValueToAsset(assetY),
          outShares: earnedShares,
          seed: {
            txHash: seed.input.txHash,
            txIndex: seed.input.outputIndex,
          },
          feeBasis: encodedSwapFee.feeBasis,
          swapFeePoints: encodedSwapFee.feePoints,
        }
      : undefined,
  )

  // biome-ignore lint/correctness/useExhaustiveDependencies: Reset the sign and submit tx when the build tx result is updated
  useEffect(() => {
    resetSignAndSubmitTx()
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
    const res = await signAndSubmitTx(buildCreatePoolTxResult.builtTx)
    if (res) {
      addUnconfirmedInteraction({
        txHash: res.txHash,
      })
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
      <div className="mx-auto mt-4 max-w-2xl px-4">
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
          <p className="flex-3">Swap fee</p>
          <Controller
            control={control}
            name="swapFeePercentage"
            render={({field}) => (
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
                  field.onChange(Number.isNaN(number) ? undefined : number)
                }}
                value={field.value?.toString()}
                suffix="%"
                valueIsNumericString
                autoComplete="off"
                className="flex-1 text-right text-md"
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
                className=" w-full"
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
                                    {formatPercentage(
                                      computeFee(
                                        pool.swapFeePoints,
                                        pool.feeBasis,
                                      ).times(100),
                                    )}
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
      </div>

      <TxSubmittedDialog
        txHash={submitTxMutationResult.data}
        onOpenChange={handleTxSubmittedDialogOpenChange}
      />
    </>
  )
}

export default CreatePoolPage
