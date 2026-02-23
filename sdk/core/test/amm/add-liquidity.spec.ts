import {describe, expect, it} from 'bun:test'
import {FeeFrom, type PoolConfig} from '@wingriders/rapid-dex-common'
import BigNumber from 'bignumber.js'
import {
  type ComputeAddLiquidityParams,
  computeAddLiquidity,
} from '../../src/amm/add-liquidity'

const poolConfig: PoolConfig = {
  swapFeePointsAToB: 0,
  swapFeePointsBToA: 0,
  treasuryFeePointsAToB: 0,
  treasuryFeePointsBToA: 0,
  feeBasis: 100,
  feeFrom: FeeFrom.InputToken,
}

describe('computeAddLiquidity', () => {
  const balancedTestCases: {
    params: ComputeAddLiquidityParams
    expected: ReturnType<typeof computeAddLiquidity>
  }[] = [
    {
      params: {
        lockA: new BigNumber(100),
        lockB: new BigNumber(100),
        poolState: {
          qtyA: new BigNumber(1000),
          qtyB: new BigNumber(1000),
          issuedShares: new BigNumber(1000),
        },
        poolConfig,
      },
      expected: {
        earnedShares: new BigNumber(100),
        xSwap: new BigNumber(0),
        addToTreasuryA: new BigNumber(0),
        addToTreasuryB: new BigNumber(0),
      },
    },
    {
      params: {
        lockA: new BigNumber(10_000_000),
        lockB: new BigNumber(82_659_658),
        poolState: {
          qtyA: new BigNumber(110_000_000),
          qtyB: new BigNumber(909_256_229),
          issuedShares: new BigNumber(316_227_766),
        },
        poolConfig,
      },
      expected: {
        earnedShares: new BigNumber(28_747_978),
        xSwap: new BigNumber(0),
        addToTreasuryA: new BigNumber(0),
        addToTreasuryB: new BigNumber(0),
      },
    },
    {
      params: {
        lockA: new BigNumber(10_000_000),
        lockB: new BigNumber(10),
        poolState: {
          qtyA: new BigNumber(110_000_000),
          qtyB: new BigNumber(909_256_229),
          issuedShares: new BigNumber(316_227_766),
        },
        poolConfig,
      },
      expected: {
        earnedShares: new BigNumber(3),
        xSwap: new BigNumber(0),
        addToTreasuryA: new BigNumber(0),
        addToTreasuryB: new BigNumber(0),
      },
    },
  ]

  balancedTestCases.forEach(({params, expected}) => {
    it('should compute earned shares correctly for balanced case', () => {
      const ret = computeAddLiquidity(params)
      expect(ret).toEqual(expected)
    })
  })

  const zapInTestCases: {
    params: ComputeAddLiquidityParams
    expected: ReturnType<typeof computeAddLiquidity>
  }[] = [
    {
      params: {
        lockA: new BigNumber(5),
        lockB: new BigNumber(0),
        poolState: {
          qtyA: new BigNumber(4),
          qtyB: new BigNumber(9),
          issuedShares: new BigNumber(6),
        },
        poolConfig,
      },
      expected: {
        earnedShares: new BigNumber(3),
        xSwap: new BigNumber(2),
        addToTreasuryA: new BigNumber(0),
        addToTreasuryB: new BigNumber(0),
      },
    },
    {
      params: {
        lockA: new BigNumber(0),
        lockB: new BigNumber(700),
        poolState: {
          qtyA: new BigNumber(1000),
          qtyB: new BigNumber(1000),
          issuedShares: new BigNumber(1000),
        },
        poolConfig: {
          ...poolConfig,
          swapFeePointsBToA: 5,
          treasuryFeePointsBToA: 1,
        },
      },
      expected: {
        earnedShares: new BigNumber(293),
        xSwap: new BigNumber(315),
        addToTreasuryA: new BigNumber(0),
        addToTreasuryB: new BigNumber(4),
      },
    },
  ]

  zapInTestCases.forEach(({params, expected}) => {
    it('should compute earned shares correctly for Zap-In case', () => {
      const ret = computeAddLiquidity(params)
      expect(ret).toEqual(expected)
    })
  })
})
