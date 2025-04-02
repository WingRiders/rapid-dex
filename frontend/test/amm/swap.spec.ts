import {describe, expect, it} from 'bun:test'
import {type ComputeNewReservesParams, computeNewReserves} from '@/amm/swap'
import BigNumber from 'bignumber.js'

describe('computeNewReserves', () => {
  const params = {
    currentX: new BigNumber(80),
    currentY: new BigNumber(30),
    swapFeePoints: 1, // 1% fee
    feeBasis: 100,
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
          feeBasis: 500,
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
    expect(result.newX).toEqual(params.currentX.plus(result.lockX))
  }

  for (const currentX of [1, 2, 7, 19, 80]) {
    for (const currentY of [1, 2, 3, 13]) {
      for (const swapFeePoints of [0, 1, 2, 3, 5, 8, 13]) {
        for (let outY = 1; outY < currentY; outY++) {
          it(`should compute new reserves for currentX = ${currentX}, currentY = ${currentY}, swapFee = ${swapFeePoints}%, outY = ${outY}`, () => {
            testComputeNewReservesFromOutY({
              currentX: new BigNumber(currentX),
              currentY: new BigNumber(currentY),
              outY: new BigNumber(outY),
              swapFeePoints,
              feeBasis: params.feeBasis,
            })
          })
        }
      }
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
