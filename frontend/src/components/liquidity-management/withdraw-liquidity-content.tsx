import {computeReturnedTokens} from '@/amm/withdraw-liquidity'
import {DECIMAL_SEPARATOR, THOUSAND_SEPARATOR} from '@/constants'
import {formatPercentage} from '@/helpers/format-percentage'
import {
  invalidateDailyActiveUsersQuery,
  invalidateTotalTvlQuery,
} from '@/helpers/invalidation'
import {useLivePoolUtxoQuery} from '@/helpers/pool'
import type {PortfolioItem} from '@/helpers/portfolio'
import {cn} from '@/lib/utils'
import {useTokenMetadata} from '@/metadata/queries'
import {useBuildWithdrawLiquidityTxQuery} from '@/on-chain/transaction/queries'
import {useTRPC} from '@/trpc/client'
import {getTxSendErrorMessage, getTxSignErrorMessage} from '@/wallet/errors'
import {
  invalidateWalletQueries,
  useSignAndSubmitTxMutation,
} from '@/wallet/queries'
import {useQueryClient} from '@tanstack/react-query'
import {LOVELACE_UNIT, sleep} from '@wingriders/rapid-dex-common'
import BigNumber from 'bignumber.js'
import {compact} from 'lodash'
import {useEffect, useMemo, useState} from 'react'
import {NumericFormat} from 'react-number-format'
import {useDebounce} from 'use-debounce'
import {AssetQuantity} from '../asset-quantity'
import {DataRows} from '../data-rows'
import {ErrorAlert} from '../error-alert'
import {TxSubmittedDialog} from '../tx-submitted-dialog'
import {Button} from '../ui/button'
import {Input} from '../ui/input'
import {Slider} from '../ui/slider'
import {Tooltip, TooltipContent, TooltipTrigger} from '../ui/tooltip'
import {useValidateWithdrawLiquidityForm} from './withdraw-liquidity-form'

const DEBOUNCE_DELAY = 100
const PERCENTAGE_INPUT_DECIMAL_SCALE = 3
const PERCENTAGES_PRESETS = [25, 50, 75, 100]

type WithdrawLiquidityContentProps = {
  portfolioItem: PortfolioItem
  onTxSubmittedModalClosed?: () => void
}

export const WithdrawLiquidityContent = ({
  portfolioItem,
  onTxSubmittedModalClosed,
}: WithdrawLiquidityContentProps) => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const {pool, ownedShares} = portfolioItem

  const {metadata: unitAMetadata} = useTokenMetadata(pool.unitA)
  const {metadata: unitBMetadata} = useTokenMetadata(pool.unitB)
  const unitATicker = unitAMetadata?.ticker ?? 'Unknown'
  const unitBTicker = unitBMetadata?.ticker ?? 'Unknown'

  const [withdrawingShares, setWithdrawingShares] = useState<BigNumber | null>(
    new BigNumber(0),
  )

  const withdrawingSharesPercentage = useMemo(
    () => withdrawingShares?.div(ownedShares).times(100).toNumber(),
    [withdrawingShares, ownedShares],
  )

  const handleWithdrawnSharesPercentageChange = (
    newPercentage: BigNumber | null,
  ) => {
    setWithdrawingShares(
      newPercentage
        ? ownedShares
            .times(newPercentage)
            .div(100)
            .integerValue(BigNumber.ROUND_FLOOR)
        : null,
    )
  }

  const returnedTokens = useMemo(
    () =>
      withdrawingShares?.gt(0)
        ? computeReturnedTokens({
            lockShares: withdrawingShares,
            poolState: pool.poolState,
          })
        : undefined,
    [withdrawingShares, pool.poolState],
  )

  const validationError = useValidateWithdrawLiquidityForm({
    withdrawingShares,
    portfolioItem,
  })
  const isValid = validationError == null

  const {
    data: poolUtxo,
    isLoading: isLoadingPoolUtxo,
    error: poolUtxoError,
  } = useLivePoolUtxoQuery({shareAssetName: pool.shareAssetName})

  const buildTxQueryArgs = useMemo<
    Parameters<typeof useBuildWithdrawLiquidityTxQuery>[0]
  >(
    () =>
      isValid &&
      withdrawingShares?.gt(0) &&
      returnedTokens != null &&
      poolUtxo != null
        ? {
            lockShares: withdrawingShares,
            outA: returnedTokens.outA,
            outB: returnedTokens.outB,
            pool: {
              ...pool,
              utxo: poolUtxo.utxo,
            },
          }
        : undefined,
    [isValid, withdrawingShares, returnedTokens, pool, poolUtxo],
  )
  const [debouncedBuildTxQueryArgs] = useDebounce(
    buildTxQueryArgs,
    DEBOUNCE_DELAY,
  )
  const areBuildTxArgsStale = buildTxQueryArgs !== debouncedBuildTxQueryArgs

  const {
    data: buildWithdrawLiquidityTxResult,
    isLoading: isLoadingBuildTx,
    error: buildWithdrawLiquidityTxError,
  } = useBuildWithdrawLiquidityTxQuery(debouncedBuildTxQueryArgs)

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
  }, [buildWithdrawLiquidityTxResult, resetSignAndSubmitTx])

  const handleWithdrawLiquidity = async () => {
    if (!buildWithdrawLiquidityTxResult) return
    const res = await signAndSubmitTx(
      buildWithdrawLiquidityTxResult.builtTx,
      true,
    )
    if (res) {
      setWithdrawingShares(new BigNumber(0))
      // empty sleep so that the invalidations are triggered after the withdrawingShares update
      await sleep(0)
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
      <div className="flex flex-col">
        <p className="mt-2 text-muted-foreground text-sm">
          Enter the percentage of liquidity to withdraw
        </p>

        <NumericFormat
          customInput={Input}
          thousandSeparator={THOUSAND_SEPARATOR}
          decimalSeparator={DECIMAL_SEPARATOR}
          allowedDecimalSeparators={['.', ',']}
          decimalScale={PERCENTAGE_INPUT_DECIMAL_SCALE}
          allowNegative={false}
          isAllowed={({value}) => !value || new BigNumber(value).lte(100)}
          type="text"
          placeholder={Number(0).toFixed(PERCENTAGE_INPUT_DECIMAL_SCALE)}
          onValueChange={({value: newValue}, {source}) => {
            if (source === 'prop') return
            handleWithdrawnSharesPercentageChange(
              newValue ? new BigNumber(newValue) : null,
            )
          }}
          value={withdrawingSharesPercentage?.toString()}
          suffix="%"
          valueIsNumericString
          autoComplete="off"
          className="mt-3 text-center text-xl"
          disabled={isSigningAndSubmittingTx}
        />

        <Slider
          value={[withdrawingShares?.toNumber() ?? 0]}
          onValueChange={([newValue]) =>
            setWithdrawingShares(
              newValue != null ? new BigNumber(newValue) : null,
            )
          }
          min={0}
          max={ownedShares.toNumber()}
          className="my-6"
          disabled={isSigningAndSubmittingTx}
        />

        <div className="flex flex-row gap-2">
          {PERCENTAGES_PRESETS.map((percentage) => {
            const percentageBigNumber = new BigNumber(percentage)
            return (
              <Button
                key={percentage}
                className="flex-1"
                variant="outline"
                onClick={() =>
                  handleWithdrawnSharesPercentageChange(percentageBigNumber)
                }
                disabled={isSigningAndSubmittingTx}
              >
                {formatPercentage(percentageBigNumber)}
              </Button>
            )
          })}
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
                  isLoadingPoolUtxo ||
                  (areBuildTxArgsStale && buildTxQueryArgs != null)
                }
                disabled={
                  isLoadingBuildTx ||
                  isLoadingPoolUtxo ||
                  !isValid ||
                  !buildWithdrawLiquidityTxResult ||
                  isSigningAndSubmittingTx ||
                  areBuildTxArgsStale
                }
                onClick={handleWithdrawLiquidity}
              >
                Withdraw liquidity
              </Button>
            </div>
          </TooltipTrigger>
          {validationError && (
            <TooltipContent>{validationError}</TooltipContent>
          )}
        </Tooltip>

        <DataRows
          className="mt-4"
          rows={compact([
            returnedTokens && {
              label: `Withdrawing ${unitATicker}`,
              value: (
                <AssetQuantity
                  unit={pool.unitA}
                  quantity={returnedTokens.outA}
                />
              ),
            },
            returnedTokens && {
              label: `Withdrawing ${unitBTicker}`,
              value: (
                <AssetQuantity
                  unit={pool.unitB}
                  quantity={returnedTokens.outB}
                />
              ),
            },
            buildWithdrawLiquidityTxResult && {
              label: 'Transaction fee',
              value: (
                <p
                  className={cn(
                    'text-md',
                    areBuildTxArgsStale && 'text-gray-400',
                  )}
                >
                  <AssetQuantity
                    unit={LOVELACE_UNIT}
                    quantity={buildWithdrawLiquidityTxResult.txFee}
                  />
                </p>
              ),
            },
          ])}
        />

        {buildWithdrawLiquidityTxError && (
          <ErrorAlert
            title="Error while building transaction"
            description={buildWithdrawLiquidityTxError.message}
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
