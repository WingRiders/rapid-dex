import {describe, expect, it, mock} from 'bun:test'
import {calculatePoolAmountAfterSwap} from '@/amm/swap'
import {buildSwapTx} from '@/onChain/transaction/buildSwapTx'
import {
  NetworkId,
  type PoolDatum,
  burnedShareTokens,
  maxShareTokens,
  poolOil,
} from '@wingriders/rapid-dex-common'
import BigNumber from 'bignumber.js'
import {mockWallet} from './fixtures'

describe('calculatePoolAmountAfterSwap', () => {
  it('works', () => {
    const poolDatum: PoolDatum = {
      aPolicyId: '',
      aAssetName: '',
      bPolicyId: 'dead',
      bAssetName: 'beef',
      swapFeePoints: 1,
      feeBasis: 10,
      sharesAssetName: 'cafe',
    }
    const poolAmount = [
      {unit: 'lovelace', quantity: poolOil.plus(20).toString()},
      {unit: 'deadbeef', quantity: '20'},
    ]
    const {newPoolAmount, outY} = calculatePoolAmountAfterSwap(
      poolDatum,
      poolAmount,
      true,
      new BigNumber(20),
    )
    expect(newPoolAmount).toEqual([
      {unit: 'lovelace', quantity: poolOil.plus(40).toString()},
      {unit: 'deadbeef', quantity: '11'},
    ])
    expect(outY.toString()).toEqual('9')
  })
})

describe('buildTx', () => {
  const address =
    'addr_test1qz2fxv2umyhttkxyxp8x0dlpdt3k6cwng5pxj3jhsydzer3n0d3vllmyqwsx5wktcd8cc3sq835lu7drv2xwl2wywfgs68faae'
  const collateralUtxo = {
    input: {
      txHash:
        'cafecafecafecafecafecafecafecafecafecafecafecafecafecafecafecafe',
      outputIndex: 0,
    },
    output: {
      amount: [{unit: 'lovelace', quantity: '5000000'}],
      address,
    },
  }
  const userUtxo = {
    input: {
      txHash:
        'cafecafecafecafecafecafecafecafecafecafecafecafecafecafecafecafe',
      outputIndex: 1,
    },
    output: {
      amount: [{unit: 'lovelace', quantity: '20000000'}],
      address,
    },
  }
  const poolUtxo = {
    input: {
      txHash:
        'cafecafecafecafecafecafecafecafecafecafecafecafecafecafecafecafe',
      outputIndex: 2,
    },
    output: {
      address:
        'addr_test1wz4j9xfsdpmzdrp67ax50dcz7jmxj7arzsfl5uv2ggh8qlgw2qdwe',
      amount: [
        {unit: 'lovelace', quantity: '20000000'},
        {
          unit: '659ab0b5658687c2e74cd10dba8244015b713bf503b90557769d77a757696e67526964657273',
          quantity: '20000000',
        },
        {
          unit: 'ab2299306876268c3af74d47b702f4b6697ba31413fa718a422e707d4e05861d714244c9398f61b1aff80bf4c20d6739bf7cb5f410b58a6c914d207e',
          quantity: maxShareTokens
            .minus(burnedShareTokens)
            .minus(20_000_000)
            .toString(),
        },
        {
          unit: 'ab2299306876268c3af74d47b702f4b6697ba31413fa718a422e707d50',
          quantity: '1',
        },
      ],
      plutusData:
        'd8799f4040581c659ab0b5658687c2e74cd10dba8244015b713bf503b90557769d77a74a57696e675269646572730a19271058204e05861d714244c9398f61b1aff80bf4c20d6739bf7cb5f410b58a6c914d207eff',
    },
  }
  const swapTxParams = {
    wallet: mockWallet,
    poolUtxo,
    aToB: true,
    lockX: new BigNumber(200_000),
  }

  it('throws readable error when no collateral UTxO is found', () => {
    mockWallet.getUtxos = mock(() => Promise.resolve([]))

    expect(buildSwapTx(swapTxParams)).rejects.toThrow(
      'No collateral UTxO found',
    )
  })

  it('throws readable error when user UTxO does not have enough funds', () => {
    mockWallet.getUtxos = mock(() =>
      Promise.resolve([collateralUtxo, userUtxo]),
    )
    mockWallet.getChangeAddress = mock(() => Promise.resolve(address))
    mockWallet.getNetworkId = mock(() => Promise.resolve(NetworkId.TESTNET))

    expect(
      buildSwapTx({...swapTxParams, lockX: new BigNumber(20_000_001)}),
    ).rejects.toThrow('Not enough funds to satisfy outputs')
  })

  it('returns built transaction and fee', async () => {
    mockWallet.getUtxos = mock(() =>
      Promise.resolve([collateralUtxo, userUtxo]),
    )
    mockWallet.getChangeAddress = mock(() => Promise.resolve(address))
    mockWallet.getNetworkId = mock(() => Promise.resolve(NetworkId.TESTNET))

    // Fixed date for deterministic TTL in the built transaction
    const now = new Date(1740757801042)
    const result = await buildSwapTx({...swapTxParams, now})

    expect(result.builtTx).toEqual(
      '84a90082825820cafecafecafecafecafecafecafecafecafecafecafecafecafecafecafecafe01825820cafecafecafecafecafecafecafecafecafecafecafecafecafecafecafecafe020182a300581d70ab2299306876268c3af74d47b702f4b6697ba31413fa718a422e707d01821a01343a40a2581c659ab0b5658687c2e74cd10dba8244015b713bf503b90557769d77a7a14a57696e675269646572731a012dd356581cab2299306876268c3af74d47b702f4b6697ba31413fa718a422e707da241500158204e05861d714244c9398f61b1aff80bf4c20d6739bf7cb5f410b58a6c914d207e1b7ffffffffececf17028201d8185855d8799f4040581c659ab0b5658687c2e74cd10dba8244015b713bf503b90557769d77a74a57696e675269646572730a19271058204e05861d714244c9398f61b1aff80bf4c20d6739bf7cb5f410b58a6c914d207eff825839009493315cd92eb5d8c4304e67b7e16ae36d61d34502694657811a2c8e337b62cfff6403a06a3acbc34f8c46003c69fe79a3628cefa9c47251821a01286c72a1581c659ab0b5658687c2e74cd10dba8244015b713bf503b90557769d77a7a14a57696e675269646572731a000359aa021a0005b34e031a051229b1075820bdaa99eb158414dea0a91d6c727e2268574b23efe6e08ab3b841abe8059a030c0b5820a4e61ab548768f9d84459898aa38d295001d6f1cc8052e53093d8a2095a0c8f30d81825820cafecafecafecafecafecafecafecafecafecafecafecafecafecafecafecafe000e81581c9493315cd92eb5d8c4304e67b7e16ae36d61d34502694657811a2c8e128182582089287140fe127b7d1e6429c720abe17fbe2a33b4a63705f3b6883284c87cb6df00a10581840001d8799fd87a801a00030d40ff821a000951411a0b2541ccf5d90103a0',
    )
    expect(result.txFee).toEqual(new BigNumber(373582))
  })
})
