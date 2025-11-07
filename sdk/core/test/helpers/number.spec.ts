import {describe, expect, test} from 'bun:test'
import {leastCommonMultiple} from '../../src/helpers/number'

describe('leastCommonMultiple (numbers)', () => {
  test('LCM of equal numbers', () => {
    expect(leastCommonMultiple(5, 5)).toBe(5)
  })

  test('LCM of co-prime numbers', () => {
    expect(leastCommonMultiple(4, 9)).toBe(36)
  })

  test('LCM with shared factors', () => {
    expect(leastCommonMultiple(6, 15)).toBe(30)
  })

  test('LCM with more than two numbers', () => {
    expect(leastCommonMultiple(4, 6, 10)).toBe(60)
  })

  test('LCM of 1 and a number is the number', () => {
    expect(leastCommonMultiple(1, 42)).toBe(42)
  })

  test('single argument returns itself', () => {
    expect(leastCommonMultiple(7)).toBe(7)
  })

  test('throws on zero', () => {
    expect(() => leastCommonMultiple(0, 5)).toThrow()
  })

  test('throws on negative numbers', () => {
    expect(() => leastCommonMultiple(-2, 5)).toThrow()
  })

  test('works for larger integers', () => {
    // lcm(12,18,30) = 180
    expect(leastCommonMultiple(12, 18, 30)).toBe(180)
  })

  test('handles prime numbers', () => {
    // lcm of 3, 5, 7 = 105
    expect(leastCommonMultiple(3, 5, 7)).toBe(105)
  })
})
