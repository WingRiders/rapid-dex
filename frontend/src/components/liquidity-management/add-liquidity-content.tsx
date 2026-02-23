import {useQueryClient} from '@tanstack/react-query'
import {LOVELACE_UNIT} from '@wingriders/rapid-dex-common'
import {computeAddLiquidity} from '@wingriders/rapid-dex-sdk-core'
import {useLivePoolUtxoQuery, useTRPC} from '@wingriders/rapid-dex-sdk-react'
import BigNumber from 'bignumber.js'
import {compact} from 'lodash'
import {InfoIcon} from 'lucide-react'
import {useEffect, useMemo} from 'react'
import {formatBigNumber} from '@/helpers/format-number'
import {
  invalidateDailyActiveUsersQuery,
  invalidateTotalTvlQuery,
} from '@/helpers/invalidation'
import {useBuildAddLiquidityTxQuery} from '@/on-chain/transaction/queries'
import type {PoolsListItem} from '@/types'
import {getTxSendErrorMessage, getTxSignErrorMessage} from '@/wallet/errors'
import {
  invalidateWalletQueries,
  useSignAndSubmitTxMutation,
  useWalletBalanceQuery,
} from '@/wallet/queries'
import {AssetInput} from '../asset-input/asset-input'
import {AssetQuantity} from '../asset-quantity'
import {DataRows} from '../data-rows'
import {ErrorAlert} from '../error-alert'
import {TxSubmittedDialog} from '../tx-submitted-dialog'
import {Button} from '../ui/button'
import {Checkbox} from '../ui/checkbox'
import {Field, FieldLabel} from '../ui/field'
import {Tooltip, TooltipContent, TooltipTrigger} from '../ui/tooltip'
import {
  useAddLiquidityForm,
  useValidateAddLiquidityForm,
} from './add-liquidity-form'

type AddLiquidityContentProps = {
  pool: PoolsListItem
  onTxSubmittedModalClosed?: () => void
}

export const AddLiquidityContent = ({
  pool,
  onTxSubmittedModalClosed,
}: AddLiquidityContentProps) => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const {data: balance, balanceState} = useWalletBalanceQuery()

  const {
    addLiquidityFormValues,
    onQuantityAChange,
    onQuantityBChange,
    onIsZapInChange,
    resetAddLiquidityForm,
  } = useAddLiquidityForm({pool})

  const addLiquidityComputedParams = useMemo(
    () =>
      addLiquidityFormValues.quantityA != null &&
      addLiquidityFormValues.quantityB != null
        ? computeAddLiquidity({
            lockA: addLiquidityFormValues.quantityA ?? new BigNumber(0),
            lockB: addLiquidityFormValues.quantityB ?? new BigNumber(0),
            poolState: pool.poolState,
            poolConfig: pool,
          })
        : undefined,
    [addLiquidityFormValues, pool],
  )

  const validationError = useValidateAddLiquidityForm({
    values: addLiquidityFormValues,
    pool,
    earnedShares: addLiquidityComputedParams?.earnedShares,
  })
  const isValid = validationError == null

  const {
    data: poolUtxo,
    isLoading: isLoadingPoolUtxo,
    error: poolUtxoError,
  } = useLivePoolUtxoQuery({shareAssetName: pool.shareAssetName})

  const {
    data: buildAddLiquidityTxResult,
    isLoading: isLoadingBuildTx,
    error: buildAddLiquidityTxError,
  } = useBuildAddLiquidityTxQuery(
    isValid &&
      addLiquidityFormValues.quantityA != null &&
      addLiquidityFormValues.quantityB != null &&
      addLiquidityComputedParams != null &&
      poolUtxo != null
      ? {
          lockA: addLiquidityFormValues.quantityA,
          lockB: addLiquidityFormValues.quantityB,
          ...addLiquidityComputedParams,
          pool: {
            ...pool,
            utxo: poolUtxo.utxo,
          },
        }
      : undefined,
  )

  const {
    signAndSubmitTx,
    signTxMutationResult,
    submitTxMutationResult,
    isPending: isSigningAndSubmittingTx,
    isError: isSignAndSubmitTxError,
    reset: resetSignAndSubmitTx,
  } = useSignAndSubmitTxMutation()

  // biome-ignore lint/correctness/useExhaustiveDependencies: Reset the error state of the sign and submit tx when the build tx result is updated
  useEffect(() => {
    if (isSignAndSubmitTxError) resetSignAndSubmitTx()
  }, [buildAddLiquidityTxResult, resetSignAndSubmitTx])

  const handleAddLiquidity = async () => {
    if (!buildAddLiquidityTxResult) return
    const res = await signAndSubmitTx(buildAddLiquidityTxResult.builtTx, true)
    if (res) {
      resetAddLiquidityForm()
      invalidateWalletQueries(queryClient)
      invalidateTotalTvlQuery(trpc, queryClient)
      invalidateDailyActiveUsersQuery(trpc, queryClient)
    }
  }

  const handleTxSubmittedDialogOpenChange = (open: boolean) => {
    if (!open) {
      resetSignAndSubmitTx()
      onTxSubmittedModalClosed?.()
    }
  }

  return (
    <>
      <div>
        <Field orientation="horizontal" className="rounded-md border p-3">
          <Checkbox
            id="zap-in-checkbox"
            checked={addLiquidityFormValues.isZapIn}
            onCheckedChange={onIsZapInChange}
            disabled={isSigningAndSubmittingTx}
          />
          <FieldLabel htmlFor="zap-in-checkbox" className="cursor-pointer">
            Enable Zap In
          </FieldLabel>
          <Tooltip>
            <TooltipTrigger asChild>
              <InfoIcon className="h-4 w-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              Zap In allows you to add liquidity using only one token. A portion
              of that token will be automatically swapped to the other token and
              added to the pool.
            </TooltipContent>
          </Tooltip>
        </Field>

        <div className="mt-2 flex flex-col gap-1">
          <AssetInput
            items={[
              {
                unit: pool.unitA,
                balance: balance?.[pool.unitA] ?? new BigNumber(0),
              },
            ]}
            value={{
              unit: pool.unitA,
              quantity: addLiquidityFormValues.quantityA,
            }}
            onChange={(value) => onQuantityAChange(value.quantity)}
            disabled={isSigningAndSubmittingTx}
            singleItem
            showMaxButton
            balanceState={balanceState}
          />
          <AssetInput
            items={[
              {
                unit: pool.unitB,
                balance: balance?.[pool.unitB] ?? new BigNumber(0),
              },
            ]}
            value={{
              unit: pool.unitB,
              quantity: addLiquidityFormValues.quantityB,
            }}
            onChange={(value) => onQuantityBChange(value.quantity)}
            disabled={isSigningAndSubmittingTx}
            singleItem
            showMaxButton
            balanceState={balanceState}
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
                loading={
                  isLoadingBuildTx ||
                  isSigningAndSubmittingTx ||
                  isLoadingPoolUtxo
                }
                disabled={
                  isLoadingBuildTx ||
                  isLoadingPoolUtxo ||
                  !isValid ||
                  !buildAddLiquidityTxResult ||
                  isSigningAndSubmittingTx
                }
                onClick={handleAddLiquidity}
              >
                Add liquidity
              </Button>
            </div>
          </TooltipTrigger>
          {validationError && (
            <TooltipContent>{validationError}</TooltipContent>
          )}
        </Tooltip>

        <DataRows
          className="mt-2"
          rows={compact([
            addLiquidityComputedParams && {
              label: 'Earned shares',
              value: formatBigNumber(addLiquidityComputedParams.earnedShares), // TODO Do we want to display xSwap?
            },
            buildAddLiquidityTxResult && {
              label: 'Transaction fee',
              value: (
                <AssetQuantity
                  unit={LOVELACE_UNIT}
                  quantity={buildAddLiquidityTxResult.txFee}
                />
              ),
            },
          ])}
        />

        {buildAddLiquidityTxError && (
          <ErrorAlert
            title="Error while building transaction"
            description={buildAddLiquidityTxError.message}
            className="mt-2"
          />
        )}
        {poolUtxoError && (
          <ErrorAlert
            title="Error while fetching pool UTxO"
            description={poolUtxoError.message}
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
