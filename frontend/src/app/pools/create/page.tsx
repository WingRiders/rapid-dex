'use client'

import {AssetInput} from '@/components/asset-input/asset-input'
import {EMPTY_ASSET_INPUT_VALUE} from '@/components/asset-input/constants'
import {
  assetInputValueToAsset,
  isAssetInputValueNonEmpty,
} from '@/components/asset-input/helpers'
import type {AssetInputItem} from '@/components/asset-input/types'
import {ErrorAlert} from '@/components/error-alert'
import {Button} from '@/components/ui/button'
import {useBuildCreatePoolTxQuery} from '@/onChain/transaction/queries'
import {useConnectedWalletStore} from '@/store/connected-wallet'
import {
  useSignAndSubmitTxMutation,
  useWalletBalanceQuery,
  useWalletUtxosQuery,
} from '@/wallet/queries'
import {
  LOVELACE_UNIT,
  isLovelaceUnit,
  poolOil,
} from '@wingriders/rapid-dex-common'
import {useEffect, useMemo} from 'react'
import {Controller, useForm} from 'react-hook-form'
import {computeSharesCreatePool} from '../../../amm/create-pool'
import {AssetQuantity} from '../../../components/asset-quantity'
import {DataRows} from '../../../components/data-rows'
import {TxSubmittedDialog} from '../../../components/tx-submitted-dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../../../components/ui/tooltip'
import {formatBigNumber} from '../../../helpers/format-number'
import {useValidateCreatePoolForm} from './helpers'
import type {CreatePoolFormInputs} from './types'

const DEFAULT_FEE_BASIS = 10_000
const DEFAULT_SWAP_FEE_POINTS = 1

const CreatePoolPage = () => {
  const {data: balance} = useWalletBalanceQuery()
  const {data: utxos} = useWalletUtxosQuery()
  const connectedWallet = useConnectedWalletStore(
    (state) => state.connectedWallet,
  )

  const {
    mutate: signAndSubmitTx,
    data: signAndSubmitTxResult,
    isPending: isSigningAndSubmittingTx,
    error: signAndSubmitTxError,
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
    },
    disabled: isSigningAndSubmittingTx,
  })

  const inputs = watch()
  const {assetX, assetY} = inputs

  const earnedShares = useMemo(() => {
    if (!assetX.quantity || !assetY.quantity) return undefined
    return computeSharesCreatePool({
      lockA: assetX.quantity,
      lockB: assetY.quantity,
    })
  }, [assetX.quantity, assetY.quantity])

  const validationError = useValidateCreatePoolForm({inputs, earnedShares})
  const isValid = validationError == null

  const seed = utxos?.[0]

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
      seed
      ? {
          wallet: connectedWallet.wallet,
          assetX: assetInputValueToAsset(assetX),
          assetY: assetInputValueToAsset(assetY),
          outShares: earnedShares,
          seed: {
            txHash: seed.input.txHash,
            txIndex: seed.input.outputIndex,
          },
          feeBasis: DEFAULT_FEE_BASIS,
          swapFeePoints: DEFAULT_SWAP_FEE_POINTS,
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

  const handleCreatePool = () => {
    if (!buildCreatePoolTxResult) return
    signAndSubmitTx(buildCreatePoolTxResult.builtTx)
  }

  const handleTxSubmittedDialogOpenChange = (open: boolean) => {
    if (!open) {
      resetSignAndSubmitTx()
      resetForm()
    }
  }

  const noAssetInputItemsMessage = 'Connect wallet'
  const emptyAssetInputItemsMessage = 'No assets found'

  return (
    <>
      <div className="mx-auto mt-4 max-w-2xl">
        <h2 className="font-bold text-2xl">Create new liquidity pool</h2>

        <div className="mt-2 flex flex-col gap-1">
          <Controller
            control={control}
            name="assetX"
            render={({field}) => (
              <AssetInput
                items={assetInputItems}
                {...field}
                noItemsMessage={noAssetInputItemsMessage}
                emptyItemsMessage={emptyAssetInputItemsMessage}
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
                noItemsMessage={noAssetInputItemsMessage}
                emptyItemsMessage={emptyAssetInputItemsMessage}
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
        {signAndSubmitTxError && (
          <ErrorAlert
            title="Error while submitting transaction"
            description={
              'info' in signAndSubmitTxError &&
              typeof signAndSubmitTxError.info === 'string'
                ? signAndSubmitTxError.info
                : (signAndSubmitTxError.message ?? 'Unknown error')
            }
            className="mt-2"
          />
        )}
      </div>

      <TxSubmittedDialog
        txHash={signAndSubmitTxResult?.txHash}
        onOpenChange={handleTxSubmittedDialogOpenChange}
      />
    </>
  )
}

export default CreatePoolPage
