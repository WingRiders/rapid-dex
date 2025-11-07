// Produces a generator that yields a tuple with the exact types
export const cartesianGen = function* <
  T extends readonly unknown[][],
  R = {
    [K in keyof T]: T[K] extends readonly (infer U)[] ? U : never
  },
>(...arrays: T): Generator<R> {
  const n = arrays.length
  if (n === 0 || arrays.some((array) => array.length === 0)) return
  const idx = Array(n).fill(0)

  while (true) {
    yield idx.map((i, j) => arrays[j][i]) as R

    let k = n - 1
    while (k >= 0) {
      idx[k]++
      if (idx[k] < arrays[k].length) break
      idx[k] = 0
      k--
    }
    if (k < 0) break
  }
}
