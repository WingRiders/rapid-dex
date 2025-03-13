import BigNumber from 'bignumber.js'

export const poolValidityAssetName = 'P'

export const poolValidityAssetNameHex = poolValidityAssetName
  .charCodeAt(0)
  .toString(16)

export const poolOil = new BigNumber(2_000_000)

export const maxShareTokens = new BigNumber('9223372036854775807')

// Amount of shares to be burned upon new pool creation.
// The value is the same as in UniSwap v2 [https://uniswap.org/whitepaper.pdf]
export const burnedShareTokens = new BigNumber(1_000)
