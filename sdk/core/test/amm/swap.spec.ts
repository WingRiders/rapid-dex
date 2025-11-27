import {describe, expect, it} from 'bun:test'
import {FeeFrom} from '@wingriders/rapid-dex-common'
import BigNumber from 'bignumber.js'
import {isFeeFromInput} from '../../src'
import {
  type ComputeNewReservesParams,
  computeNewReserves,
} from '../../src/amm/swap'
import {cartesianGen} from './cartesian-gen'

describe('computeNewReserves', () => {
  const params = {
    currentX: new BigNumber(80),
    currentY: new BigNumber(30),
    swapFeePoints: 1,
    treasuryFeePoints: 0,
    feeBasis: 100,
    aToB: true,
    feeFrom: FeeFrom.InputToken,
  }

  describe('computeNewReserves with lockX', () => {
    const testCases: {
      params: Required<Omit<ComputeNewReservesParams, 'outY'>>
      expectedOutY: BigNumber
    }[] = [
      {
        params: {
          currentX: new BigNumber(100_000_000),
          currentY: new BigNumber(1_000_000_000),
          lockX: new BigNumber(10_000_000),
          swapFeePoints: 1,
          treasuryFeePoints: 0,
          feeBasis: 500,
          aToB: true,
          feeFrom: FeeFrom.InputToken,
        },
        expectedOutY: new BigNumber(90_743_771),
      },
    ]

    testCases.forEach(({params, expectedOutY}) => {
      it(`should compute new reserves for lockX = ${params.lockX}`, () => {
        const result = computeNewReserves(params)

        expect(result.newX).toEqual(params.currentX.plus(params.lockX))
        expect(result.lockX).toEqual(params.lockX)
        expect(result.outY).toEqual(expectedOutY)
      })
    })
  })

  const testComputeNewReservesFromOutY = (
    params: Omit<ComputeNewReservesParams, 'lockX'> & {outY: BigNumber},
  ) => {
    const result = computeNewReserves(params)

    expect(result.outY.toNumber()).toBeGreaterThanOrEqual(
      params.outY.toNumber(),
    )
    expect(result.lockX.toNumber()).toBeGreaterThan(0)

    const expectedNewX = params.currentX
      .plus(result.lockX)
      .minus(
        isFeeFromInput(params.feeFrom, params.aToB)
          ? result.paidTreasuryFee
          : 0,
      )
    expect(result.newX).toEqual(expectedNewX)
  }

  for (const [
    currentX,
    currentY,
    swapFeePoints,
    treasuryFeePoints,
    aToB,
    feeFrom,
  ] of cartesianGen(
    [1, 2, 7, 19, 80], // currentX
    [1, 2, 3, 13], // currentY
    [0, 1, 2, 3, 5, 8, 13], // swapFeePoints
    [0, 1, 2, 3, 5, 8, 13], // treasuryFeePoints
    [true, false], // aToB
    Object.values(FeeFrom), // feeFrom,
  )) {
    const maxOutY = // Getting more Y than maxOutY is impossible
      currentY -
      1 - // 1 Y must stay in the pool in all cases
      (isFeeFromInput(feeFrom, aToB)
        ? 0
        : Math.ceil((swapFeePoints * currentY) / params.feeBasis) +
          Math.ceil((treasuryFeePoints * currentY) / params.feeBasis))
    for (let outY = 1; outY <= maxOutY; outY++) {
      it(`should compute new reserves for currentX = ${currentX}, currentY = ${currentY}, swapFee = ${swapFeePoints}%, treasuryFee = ${treasuryFeePoints}%, outY = ${outY}, aToB = ${aToB}, feeFrom = ${feeFrom}`, () => {
        testComputeNewReservesFromOutY({
          currentX: new BigNumber(currentX),
          currentY: new BigNumber(currentY),
          outY: new BigNumber(outY),
          swapFeePoints,
          treasuryFeePoints,
          feeBasis: params.feeBasis,
          aToB,
          feeFrom,
        })
      })
    }
  }

  it('should throw error if both lockX and outY are provided', () => {
    const lockX = new BigNumber(100)
    const outY = new BigNumber(20)

    expect(() => computeNewReserves({...params, lockX, outY})).toThrow(
      'Provide only one of lockX or outY, not both.',
    )
  })

  it('should throw error if neither lockX nor outY are provided', () => {
    expect(() => computeNewReserves(params)).toThrow(
      'Either lockX or outY must be provided.',
    )
  })
})
