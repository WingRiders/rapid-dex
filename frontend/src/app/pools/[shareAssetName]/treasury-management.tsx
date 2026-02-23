import type {UTxO} from '@meshsdk/core'
import {useLivePoolUtxoQuery} from '@wingriders/rapid-dex-sdk-react'
import {useEffect, useMemo, useState} from 'react'
import {AssetQuantity} from '@/components/asset-quantity'
import {ErrorAlert} from '@/components/error-alert'
import {TxSubmittedDialog} from '@/components/tx-submitted-dialog'
import {Button} from '@/components/ui/button'
import {cn} from '@/lib/utils'
import {useTokenMetadata} from '@/metadata/queries'
import {useBuildWithdrawTreasuryTxQuery} from '@/on-chain/transaction/queries'
import type {PoolsListItem} from '@/types'
import {getTxSendErrorMessage, getTxSignErrorMessage} from '@/wallet/errors'
import {useSignAndSubmitTxMutation, useWalletUtxosQuery} from '@/wallet/queries'

type MaybeTreasuryManagementProps = {
  pool: PoolsListItem
  className?: string
}

export const MaybeTreasuryManagement = ({
  pool,
  className,
}: MaybeTreasuryManagementProps) => {
  const {data: walletUtxos} = useWalletUtxosQuery()

  const treasuryAuthorityUtxo = useMemo(() => {
    if (!pool || !walletUtxos) return undefined

    return walletUtxos.find((utxo) =>
      utxo.output.amount.some(
        (asset) => asset.unit === pool.treasuryAuthorityUnit,
      ),
    )
  }, [pool, walletUtxos])

  const isTreasuryEnabled =
    pool.treasuryFeePointsAToB > 0 || pool.treasuryFeePointsBToA > 0

  if (!treasuryAuthorityUtxo || !isTreasuryEnabled) return null

  return (
    <TreasuryManagement
      pool={pool}
      treasuryAuthorityUtxo={treasuryAuthorityUtxo}
      className={className}
    />
  )
}

type TreasuryManagementProps = {
  pool: PoolsListItem
  treasuryAuthorityUtxo: UTxO
  className?: string
}

export const TreasuryManagement = ({
  pool,
  treasuryAuthorityUtxo,
  className,
}: TreasuryManagementProps) => {
  const [isBuildWithdrawTxQueryEnabled, setIsBuildWithdrawTxQueryEnabled] =
    useState(false)

  const {metadata: unitAMetadata} = useTokenMetadata(pool.unitA)
  const {metadata: unitBMetadata} = useTokenMetadata(pool.unitB)

  const unitATicker = unitAMetadata?.ticker ?? unitAMetadata?.name ?? 'unknown'
  const unitBTicker = unitBMetadata?.ticker ?? unitBMetadata?.name ?? 'unknown'

  const {
    data: poolUtxo,
    isLoading: isLoadingPoolUtxo,
    error: poolUtxoError,
  } = useLivePoolUtxoQuery({
    shareAssetName: pool.shareAssetName,
  })

  const {
    data: buildWithdrawTreasuryTxResult,
    isLoading: isLoadingBuildTx,
    error: buildWithdrawTreasuryTxError,
  } = useBuildWithdrawTreasuryTxQuery(
    isBuildWithdrawTxQueryEnabled && treasuryAuthorityUtxo && poolUtxo
      ? {
          pool: {
            ...pool,
            utxo: poolUtxo.utxo,
          },
          treasuryAuthorityUtxo,
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
  }, [buildWithdrawTreasuryTxResult, resetSignAndSubmitTx])

  useEffect(() => {
    if (!buildWithdrawTreasuryTxResult) return

    signAndSubmitTx(buildWithdrawTreasuryTxResult.builtTx, true).then(() => {
      setIsBuildWithdrawTxQueryEnabled(false)
    })
  }, [buildWithdrawTreasuryTxResult, signAndSubmitTx])

  const handleTxSubmittedDialogOpenChange = (open: boolean) => {
    if (!open) {
      resetSignAndSubmitTx()
    }
  }

  const hasTreasury =
    pool.poolState.treasuryA.gt(0) || pool.poolState.treasuryB.gt(0)

  if (!treasuryAuthorityUtxo) return null

  return (
    <>
      <div className={cn('rounded-lg border bg-card p-6', className)}>
        <div className="mb-4">
          <h3 className="font-bold text-xl">Accumulated treasury</h3>
          <p className="mt-1 text-muted-foreground text-sm">
            Fees collected from swaps that can be withdrawn by the treasury
            authority.
          </p>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-md bg-muted/50 p-3">
            <span className="font-medium text-sm">{unitATicker}</span>
            <AssetQuantity
              unit={pool.unitA}
              quantity={pool.poolState.treasuryA}
              showTicker={false}
            />
          </div>
          <div className="flex items-center justify-between rounded-md bg-muted/50 p-3">
            <span className="font-medium text-sm">{unitBTicker}</span>
            <AssetQuantity
              unit={pool.unitB}
              quantity={pool.poolState.treasuryB}
              showTicker={false}
            />
          </div>
        </div>

        <Button
          className="mt-4 w-full"
          size="lg"
          onClick={() => setIsBuildWithdrawTxQueryEnabled(true)}
          disabled={
            !hasTreasury ||
            isLoadingPoolUtxo ||
            (isBuildWithdrawTxQueryEnabled && !buildWithdrawTreasuryTxResult) ||
            isSigningAndSubmittingTx
          }
          loading={
            isLoadingPoolUtxo ||
            (isBuildWithdrawTxQueryEnabled && isLoadingBuildTx) ||
            isSigningAndSubmittingTx
          }
        >
          Withdraw treasury
        </Button>

        {buildWithdrawTreasuryTxError && (
          <ErrorAlert
            title="Error while building transaction"
            description={buildWithdrawTreasuryTxError.message}
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
