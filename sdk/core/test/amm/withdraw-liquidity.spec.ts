import {describe, expect, it} from 'bun:test'
import {
  FeeFrom,
  maxShareTokens,
  type PoolConfig,
} from '@wingriders/rapid-dex-common'
import BigNumber from 'bignumber.js'
import {
  type ComputeWithdrawLiquidityParams,
  computeWithdrawLiquidity,
} from '../../src/amm/withdraw-liquidity'

const poolConfig: PoolConfig = {
  swapFeePointsAToB: 0,
  swapFeePointsBToA: 0,
  treasuryFeePointsAToB: 0,
  treasuryFeePointsBToA: 0,
  feeBasis: 100,
  feeFrom: FeeFrom.InputToken,
}

describe('computeWithdrawLiquidity', () => {
  const balancedTestCases: {
    params: ComputeWithdrawLiquidityParams
    expected: ReturnType<typeof computeWithdrawLiquidity>
  }[] = [
    {
      params: {
        lockShares: new BigNumber(100),
        poolState: {
          qtyA: new BigNumber(1000),
          qtyB: new BigNumber(1000),
          issuedShares: new BigNumber(1000),
        },
        poolConfig,
        withdrawType: 'TO_BOTH',
      },
      expected: {
        outA: new BigNumber(100),
        outB: new BigNumber(100),
        addToTreasuryA: new BigNumber(0),
        addToTreasuryB: new BigNumber(0),
      },
    },
    {
      params: {
        lockShares: new BigNumber(172_487_372),
        poolState: {
          qtyA: new BigNumber(120_000_000),
          qtyB: new BigNumber(991_915_887),
          issuedShares: new BigNumber(344_975_744),
        },
        poolConfig,
        withdrawType: 'TO_BOTH',
      },
      expected: {
        outA: new BigNumber(59_999_826),
        outB: new BigNumber(495_956_505),
        addToTreasuryA: new BigNumber(0),
        addToTreasuryB: new BigNumber(0),
      },
    },
  ]

  balancedTestCases.forEach(({params, expected}) => {
    it('should compute returned tokens correctly for balanced case', () => {
      const ret = computeWithdrawLiquidity(params)
      expect(ret).toEqual(expected)
    })
  })

  const zapOutTestCases: {
    params: ComputeWithdrawLiquidityParams
    expected: ReturnType<typeof computeWithdrawLiquidity>
  }[] = [
    {
      params: {
        lockShares: new BigNumber(3),
        poolState: {
          qtyA: new BigNumber(9),
          qtyB: new BigNumber(9),
          issuedShares: new BigNumber(9),
        },
        poolConfig,
        withdrawType: 'TO_A',
      },
      expected: {
        outA: new BigNumber(5),
        outB: new BigNumber(0),
        addToTreasuryA: new BigNumber(0),
        addToTreasuryB: new BigNumber(0),
      },
    },
    {
      params: {
        lockShares: new BigNumber(700),
        poolState: {
          qtyA: new BigNumber(1000),
          qtyB: new BigNumber(1000),
          issuedShares: new BigNumber(1000),
        },
        poolConfig: {
          ...poolConfig,
          swapFeePointsAToB: 5,
          treasuryFeePointsAToB: 1,
        },
        withdrawType: 'TO_B',
      },
      expected: {
        outA: new BigNumber(0),
        outB: new BigNumber(906),
        addToTreasuryA: new BigNumber(7),
        addToTreasuryB: new BigNumber(0),
      },
    },
    {
      params: {
        lockShares: new BigNumber(100),
        poolState: {
          qtyA: new BigNumber(10_000_021),
          qtyB: new BigNumber(999_993),
          issuedShares: maxShareTokens.minus('9223372036851613541'),
          treasuryA: new BigNumber(1),
          treasuryB: new BigNumber(0),
        },
        poolConfig: {
          ...poolConfig,
          swapFeePointsAToB: 2,
          swapFeePointsBToA: 2,
          treasuryFeePointsAToB: 1,
          treasuryFeePointsBToA: 1,
        },
        withdrawType: 'TO_A',
      },
      expected: {
        outA: new BigNumber(605),
        outB: new BigNumber(0),
        addToTreasuryA: new BigNumber(0),
        addToTreasuryB: new BigNumber(1),
      },
    },
  ]

  zapOutTestCases.forEach(({params, expected}) => {
    it('should compute returned tokens correctly for Zap-Out case', () => {
      const ret = computeWithdrawLiquidity(params)
      expect(ret).toEqual(expected)
    })
  })
})
