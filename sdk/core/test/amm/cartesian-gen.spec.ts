import {describe, expect, it} from 'bun:test'
import {cartesianGen} from './cartesian-gen'

describe('cartesianGen', () => {
  it('returns all Cartesian combinations of 2 arrays', () => {
    const xs = [1, 2] as const
    const ys = ['a', 'b'] as const

    const result = Array.from(cartesianGen(xs, ys))

    expect(result).toEqual([
      [1, 'a'],
      [1, 'b'],
      [2, 'a'],
      [2, 'b'],
    ])
  })

  it('returns all Cartesian combinations of 3 arrays', () => {
    const xs = [1, 2] as const
    const ys = ['a', 'b'] as const
    const zs = [true, false] as const

    const result = Array.from(cartesianGen(xs, ys, zs))

    expect(result).toEqual([
      [1, 'a', true],
      [1, 'a', false],
      [1, 'b', true],
      [1, 'b', false],
      [2, 'a', true],
      [2, 'a', false],
      [2, 'b', true],
      [2, 'b', false],
    ])
  })

  it('yields empty array if given an empty array', () => {
    const xs: number[] = []
    const ys = ['a', 'b'] as const

    const result = Array.from(cartesianGen(xs, ys))

    expect(result).toEqual([])
  })

  it('handles single array identity', () => {
    const xs = [42, 43] as const

    const result = Array.from(cartesianGen(xs))

    expect(result).toEqual([[42], [43]])
  })

  it('preserves types at compile time', () => {
    const xs = [1] as const
    const ys = ['a'] as const
    const gen = cartesianGen(xs, ys)

    // If TypeScript types are wrong, this test won't compile
    const first = gen.next().value
    const x: number = first[0]
    const y: string = first[1]

    expect(x).toBe(1)
    expect(y).toBe('a')
  })
})
