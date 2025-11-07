const greatestCommonDivisor = (a: number, b: number): number =>
  b === 0 ? a : greatestCommonDivisor(b, a % b)

export const leastCommonMultiple = (a: number, ...nums: number[]): number => {
  if (a <= 0 || nums.some((num) => num <= 0))
    throw new Error(`Expected positive numbers: ${a},${nums.join(',')}`)
  if (nums.length === 0) return a
  const b = nums[0]!
  const rest = nums.slice(1)
  return leastCommonMultiple((a * b) / greatestCommonDivisor(a, b), ...rest)
}
