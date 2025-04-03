'use client'
import {AssetInput} from '@/components/asset-input/asset-input'
import {isAssetInputValueNonEmpty} from '@/components/asset-input/helpers'
import {AssetQuantity} from '@/components/asset-quantity'
import {DataRows} from '@/components/data-rows'
import {ErrorAlert} from '@/components/error-alert'
import {TxSubmittedDialog} from '@/components/tx-submitted-dialog'
import {Button} from '@/components/ui/button'
import {Tooltip, TooltipContent, TooltipTrigger} from '@/components/ui/tooltip'
import {useLivePoolUtxoQuery, usePoolsQuery} from '@/helpers/pool'
import {useBuildSwapTxQuery} from '@/on-chain/transaction/queries'
import {useLocalInteractionsStore} from '@/store/local-interactions'
import {getTxSendErrorMessage, getTxSignErrorMessage} from '@/wallet/errors'
import {
  invalidateWalletQueries,
  useSignAndSubmitTxMutation,
  useWalletBalanceQuery,
} from '@/wallet/queries'
import {skipToken, useQueryClient} from '@tanstack/react-query'
import {LOVELACE_UNIT} from '@wingriders/rapid-dex-common'
import {compact} from 'lodash'
import {ArrowDownUpIcon} from 'lucide-react'
import {useEffect, useMemo} from 'react'
import {getSwapFormInputItems, poolsToUnits} from './helpers'
import {RouteSelectButton} from './route-select-button'
import {useSwapForm, useValidateSwapForm} from './swap-form'

const SwapPage = () => {
  const queryClient = useQueryClient()

  const {data: balance} = useWalletBalanceQuery()
  const {data: pools} = usePoolsQuery()
  const addUnconfirmedInteraction = useLocalInteractionsStore(
    (state) => state.addUnconfirmedInteraction,
  )

  const {swapUnits, shareAssetNames} = useMemo(() => {
    if (!pools) return {swapUnits: undefined, shareAssetNames: undefined}
    return {
      swapUnits: poolsToUnits(pools),
      shareAssetNames: pools.map((pool) => pool.shareAssetName),
    }
  }, [pools])

  const {
    swapFormValues,
    onFromValueChange,
    onToValueChange,
    onShareAssetNameChange,
    onFlipAssets,
    resetSwapForm,
  } = useSwapForm({
    pools,
    swapUnits,
    shareAssetNames,
  })
  const {from, to, shareAssetName, availableRoutes} = swapFormValues

  const validationError = useValidateSwapForm({values: swapFormValues})
  const isValid = validationError == null

  const selectedRouteIndex = useMemo(
    () =>
      shareAssetName
        ? (availableRoutes?.findIndex(
            ({pool}) => pool.shareAssetName === shareAssetName,
          ) ?? null)
        : null,
    [availableRoutes, shareAssetName],
  )
  const selectedRoute =
    selectedRouteIndex != null
      ? availableRoutes?.[selectedRouteIndex]
      : undefined

  const {
    data: selectedPoolUtxo,
    isLoading: isLoadingSelectedPoolUtxo,
    error: selectedPoolUtxoError,
  } = useLivePoolUtxoQuery(shareAssetName ? {shareAssetName} : skipToken)

  const {
    signAndSubmitTx,
    signTxMutationResult,
    submitTxMutationResult,
    isPending: isSigningAndSubmittingTx,
    isError: isSignAndSubmitTxError,
    reset: resetSignAndSubmitTx,
  } = useSignAndSubmitTxMutation()

  const {
    data: buildSwapTxResult,
    error: buildSwapTxError,
    isLoading: isLoadingBuildTx,
  } = useBuildSwapTxQuery(
    isAssetInputValueNonEmpty(from) &&
      isAssetInputValueNonEmpty(to) &&
      from.quantity.gt(0) &&
      to.quantity.gt(0) &&
      selectedRoute &&
      selectedPoolUtxo &&
      isValid
      ? {
          lockX: from.quantity,
          outY: to.quantity,
          aToB: from.unit === selectedRoute.pool.unitA,
          pool: {
            ...selectedRoute.pool,
            utxo: selectedPoolUtxo.utxo,
          },
        }
      : undefined,
  )

  const [assetFromInputItems, assetToInputItems] = useMemo(() => {
    if (!pools || !swapUnits) return [null, null]

    return getSwapFormInputItems(pools, swapUnits, balance, from.unit)
  }, [pools, balance, from.unit, swapUnits])

  // biome-ignore lint/correctness/useExhaustiveDependencies: Reset the error state of the sign and submit tx when the build tx result is updated
  useEffect(() => {
    if (isSignAndSubmitTxError) resetSignAndSubmitTx()
  }, [buildSwapTxResult, resetSignAndSubmitTx])

  const handleSwap = async () => {
    if (!buildSwapTxResult) return
    const res = await signAndSubmitTx(buildSwapTxResult.builtTx)
    if (res) {
      addUnconfirmedInteraction({
        txHash: res.txHash,
      })
      invalidateWalletQueries(queryClient)
    }
  }

  const handleTxSubmittedDialogOpenChange = (open: boolean) => {
    if (!open) {
      resetSignAndSubmitTx()
      resetSwapForm()
    }
  }

  return (
    <>
      <div className="mx-auto mt-4 max-w-2xl px-4">
        <h2 className="font-bold text-2xl">Swap</h2>

        <div className="relative mt-4 flex flex-col gap-1">
          <AssetInput
            items={assetFromInputItems}
            value={from}
            onChange={onFromValueChange}
            disabled={isSigningAndSubmittingTx}
            showMaxButton
          />

          <AssetInput
            items={assetToInputItems}
            value={to}
            onChange={onToValueChange}
            disabled={isSigningAndSubmittingTx}
          />

          <Button
            variant="secondary"
            className="-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2"
            onClick={onFlipAssets}
            disabled={isSigningAndSubmittingTx}
          >
            <ArrowDownUpIcon />
          </Button>
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
                loading={
                  isLoadingBuildTx ||
                  isSigningAndSubmittingTx ||
                  isLoadingSelectedPoolUtxo
                }
                disabled={
                  isLoadingBuildTx ||
                  isLoadingSelectedPoolUtxo ||
                  !isValid ||
                  !buildSwapTxResult ||
                  isSigningAndSubmittingTx
                }
                onClick={handleSwap}
              >
                Swap
              </Button>
            </div>
          </TooltipTrigger>
          {validationError && (
            <TooltipContent>{validationError}</TooltipContent>
          )}
        </Tooltip>

        <DataRows
          rows={compact([
            availableRoutes && {
              label: 'Liquidity pool',
              value: (
                <RouteSelectButton
                  availableRoutes={availableRoutes}
                  selectedRouteIndex={selectedRouteIndex}
                  onSelectedRouteChange={onShareAssetNameChange}
                  isSwapAToB={from.unit === selectedRoute?.pool.unitA}
                  disabled={isSigningAndSubmittingTx}
                  hasInputQuantities={!!from.quantity || !!to.quantity}
                />
              ),
            },
            ...(buildSwapTxResult
              ? [
                  {
                    label: 'Transaction fee',
                    value: (
                      <AssetQuantity
                        unit={LOVELACE_UNIT}
                        quantity={buildSwapTxResult.txFee}
                      />
                    ),
                  },
                ]
              : []),
            selectedRoute?.swapQuantities &&
              from.unit && {
                label: 'Swap fee',
                value: (
                  <AssetQuantity
                    unit={from.unit}
                    quantity={selectedRoute.swapQuantities.paidSwapFee}
                  />
                ),
              },
          ])}
          className="mt-4"
        />

        {buildSwapTxError && (
          <ErrorAlert
            title="Error while building transaction"
            description={buildSwapTxError.message}
            className="mt-2"
          />
        )}
        {selectedPoolUtxoError && (
          <ErrorAlert
            title="Error while fetching pool UTxO"
            description={selectedPoolUtxoError.message}
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

export default SwapPage
