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

  it('should compute new reserves from lockX', () => {
    const lockX = new BigNumber(81)
    const result = computeNewReserves({...params, lockX})

    expect(result.newX).toEqual(params.currentX.plus(lockX))
    expect(result.lockX).toEqual(lockX)
    expect(result.outY).toEqual(new BigNumber(15))
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
