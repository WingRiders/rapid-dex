# Rapid DEX SDK Core

## What is this library for?

The Rapid DEX SDK Core library facilitates work with Rapid DEX, providing essential functionality for:

- **AMM math** - Calculate swap outputs, liquidity shares, and pool reserves
- **Transaction building** - Build Cardano transactions for pool operations
- **CLI** - Command-line interface for interacting with Rapid DEX
- **Data fetching** - Fetch pool data and analytics via tRPC
- **Generic helpers** - Utility functions for asset handling, number operations, and fee calculations

## Key Dependencies

This SDK uses the following libraries:

- **Mesh.js** - For Cardano on-chain operations and transaction building
- **bignumber.js** - For handling big numbers and precise calculations

## Installation

Install the package via NPM:

```bash
bun install @wingriders/rapid-dex-sdk-core
```

## AMM Math Functions

The SDK provides mathematical functions for Automated Market Maker (AMM) operations.

### `computeSharesCreatePool`

Calculates the number of share tokens received when creating a new pool.

```typescript
import {computeSharesCreatePool} from '@wingriders/rapid-dex-sdk-core'
import BigNumber from 'bignumber.js'

const shares = computeSharesCreatePool({
  lockX: new BigNumber('1000000'), // Amount of token X
  lockY: new BigNumber('2000000'), // Amount of token Y
})
```

**Parameters:**

- `lockX: BigNumber` - The amount of token X to add to the pool
- `lockY: BigNumber` - The amount of token Y to add to the pool

**Returns:** `BigNumber` - The number of share tokens received

### `computeEarnedShares`

Calculates the number of share tokens received when adding liquidity to an existing pool.

```typescript
import {computeEarnedShares} from '@wingriders/rapid-dex-sdk-core'
import BigNumber from 'bignumber.js'

const shares = computeEarnedShares({
  lockA: new BigNumber('1000000'), // Amount of token A to add
  lockB: new BigNumber('2000000'), // Amount of token B to add
  poolState: {
    qtyA: new BigNumber('10000000'),
    qtyB: new BigNumber('20000000'),
    issuedShares: new BigNumber('5000000'),
  },
})
```

**Parameters:**

- `lockA: BigNumber` - The amount of token A to add to the pool
- `lockB: BigNumber` - The amount of token B to add to the pool
- `poolState: PoolState` - The current state of the pool

**Returns:** `BigNumber` - The number of share tokens received

### `computeReturnedTokens`

Calculates the amount of pool tokens received when withdrawing liquidity.

```typescript
import {computeReturnedTokens} from '@wingriders/rapid-dex-sdk-core'
import BigNumber from 'bignumber.js'

const {outA, outB} = computeReturnedTokens({
  lockShares: new BigNumber('1000000'), // Amount of shares to withdraw
  poolState: {
    qtyA: new BigNumber('10000000'),
    qtyB: new BigNumber('20000000'),
    issuedShares: new BigNumber('5000000'),
  },
})
```

**Parameters:**

- `lockShares: BigNumber` - The amount of share tokens to withdraw
- `poolState: PoolState` - The current state of the pool

**Returns:** `{ outA: BigNumber, outB: BigNumber }` - The amounts of tokens A and B received

### `computeNewReserves`

Calculates the new pool reserves after a swap operation.

```typescript
import {computeNewReserves} from '@wingriders/rapid-dex-sdk-core'
import {FeeFrom} from '@wingriders/rapid-dex-common'
import BigNumber from 'bignumber.js'

// Calculate based on input amount
const result = computeNewReserves({
  currentX: new BigNumber('10000000'),
  currentY: new BigNumber('20000000'),
  lockX: new BigNumber('1000000'), // Amount to sell
  swapFeePoints: 30, // Fee in basis points
  feeBasis: 10000,
  aToB: true,
  feeFrom: FeeFrom.InputToken,
})

// Or calculate based on desired output
const result2 = computeNewReserves({
  currentX: new BigNumber('10000000'),
  currentY: new BigNumber('20000000'),
  outY: new BigNumber('1900000'), // Desired output amount
  swapFeePoints: 30,
  feeBasis: 10000,
  aToB: true,
  feeFrom: FeeFrom.OutputToken,
})
```

**Parameters:**

- `currentX: BigNumber` - The current amount of token X in the pool
- `currentY: BigNumber` - The current amount of token Y in the pool
- `lockX?: BigNumber` - The amount of token X to be sold (mutually exclusive with `outY`)
- `outY?: BigNumber` - The amount of token Y to be bought (mutually exclusive with `lockX`)
- `swapFeePoints: number` - The swap fee points
- `feeBasis: number` - The fee basis
- `aToB: boolean` - Whether the swap is from token A to token B
- `feeFrom: FeeFrom` - Which token the fee is taken from

**Returns:** `{ newX: BigNumber, newY: BigNumber, lockX: BigNumber, outY: BigNumber, paidSwapFee: BigNumber }` - The new pool reserves and swap details

## Transaction Building Functions

The SDK provides functions to build Cardano transactions for pool operations.

### `buildCreatePoolTx`

Builds a transaction for creating a new liquidity pool.

```typescript
import {buildCreatePoolTx} from '@wingriders/rapid-dex-sdk-core'
import {FeeFrom} from '@wingriders/rapid-dex-common'
import BigNumber from 'bignumber.js'

const {builtTx, txFee, sharesAssetName} = await buildCreatePoolTx({
  wallet,
  assetX: {
    unit: 'lovelace',
    quantity: '1000000',
  },
  assetY: {
    unit: 'policyId.assetName',
    quantity: '2000000',
  },
  outShares: new BigNumber('1000000'),
  seed: {
    txHash: '...',
    txIndex: 0,
  },
  feeBasis: 10000,
  feeFrom: FeeFrom.InputToken,
  swapFeePointsAToB: 30,
  swapFeePointsBToA: 30,
})
```

**Parameters:**

- `wallet: IWallet` - Mesh wallet instance
- `fetcher?: IFetcher` - Optional UTxO fetcher
- `assetX: Asset` - First asset to add to the pool
- `assetY: Asset` - Second asset to add to the pool
- `outShares: BigNumber` - Number of shares to mint for the creator
- `seed: RefTxIn` - Reference transaction input for pool identification
- `feeBasis: number` - Fee basis for calculations
- `feeFrom: FeeFrom` - Which token the fee is taken from
- `swapFeePointsAToB: number` - Swap fee points for A to B direction
- `swapFeePointsBToA: number` - Swap fee points for B to A direction
- `now?: Date` - Optional timestamp (defaults to current date)

**Returns:** `Promise<{ builtTx: string, txFee: BigNumber, sharesAssetName: string }>`

### `buildSwapTx`

Builds a transaction for swapping tokens in a liquidity pool.

```typescript
import {buildSwapTx} from '@wingriders/rapid-dex-sdk-core'
import BigNumber from 'bignumber.js'

const {builtTx, txFee} = await buildSwapTx({
  wallet,
  pool: {
    // Pool data from tRPC query
    utxo: poolUtxo.utxo,
    // ... other pool properties
  },
  aToB: true,
  lockX: new BigNumber('1000000'),
  outY: new BigNumber('1900000'),
})
```

**Parameters:**

- `wallet: IWallet` - Mesh wallet instance
- `fetcher?: IFetcher` - Optional UTxO fetcher
- `pool: PoolInteractionTxPool` - Pool data including UTxO
- `aToB: boolean` - Whether swapping from token A to token B
- `lockX: BigNumber` - Amount of input token
- `outY: BigNumber` - Amount of output token
- `now?: Date` - Optional timestamp (defaults to current date)

**Returns:** `Promise<{ builtTx: string, txFee: BigNumber }>`

### `buildAddLiquidityTx`

Builds a transaction for adding liquidity to a pool.

```typescript
import {buildAddLiquidityTx} from '@wingriders/rapid-dex-sdk-core'
import BigNumber from 'bignumber.js'

const {builtTx, txFee} = await buildAddLiquidityTx({
  wallet,
  pool: {
    // Pool data from tRPC query
    utxo: poolUtxo.utxo,
    // ... other pool properties
  },
  lockA: new BigNumber('1000000'),
  lockB: new BigNumber('2000000'),
  earnedShares: new BigNumber('500000'),
})
```

**Parameters:**

- `wallet: IWallet` - Mesh wallet instance
- `fetcher?: IFetcher` - Optional UTxO fetcher
- `pool: PoolInteractionTxPool` - Pool data including UTxO
- `lockA: BigNumber` - Amount of token A to add
- `lockB: BigNumber` - Amount of token B to add
- `earnedShares: BigNumber` - Number of shares to receive
- `now?: Date` - Optional timestamp (defaults to current date)

**Returns:** `Promise<{ builtTx: string, txFee: BigNumber }>`

### `buildWithdrawLiquidityTx`

Builds a transaction for withdrawing liquidity from a pool.

```typescript
import {buildWithdrawLiquidityTx} from '@wingriders/rapid-dex-sdk-core'
import BigNumber from 'bignumber.js'

const {builtTx, txFee} = await buildWithdrawLiquidityTx({
  wallet,
  pool: {
    // Pool data from tRPC query
    utxo: poolUtxo.utxo,
    // ... other pool properties
  },
  lockShares: new BigNumber('1000000'),
  outA: new BigNumber('500000'),
  outB: new BigNumber('1000000'),
})
```

**Parameters:**

- `wallet: IWallet` - Mesh wallet instance
- `fetcher?: IFetcher` - Optional UTxO fetcher
- `pool: PoolInteractionTxPool` - Pool data including UTxO
- `lockShares: BigNumber` - Amount of shares to withdraw
- `outA: BigNumber` - Amount of token A to receive
- `outB: BigNumber` - Amount of token B to receive
- `now?: Date` - Optional timestamp (defaults to current date)

**Returns:** `Promise<{ builtTx: string, txFee: BigNumber }>`

## CLI Commands

The SDK includes a CLI tool for interacting with Rapid DEX. Run commands using:

```bash
bun run cli <command>
```

For detailed documentation on each command, use the `--help` flag:

```bash
bun run cli --help
bun run cli transaction --help
bun run cli transaction create-pool --help
```

### create-pool

Creates a new liquidity pool.

```bash
bun run cli transaction create-pool \
  --unit-x lovelace \
  --unit-y <policyId>.<assetName> \
  --quantity-x 1000000 \
  --quantity-y 2000000 \
  --fee-a-to-b 0.3 \
  --fee-b-to-a 0.3 \
  --fee-from InputToken
```

**Options:**

- `--unit-x <string>` - Unit of asset X (required)
- `--unit-y <string>` - Unit of asset Y (required)
- `--quantity-x <number>` - Quantity of asset X (required)
- `--quantity-y <number>` - Quantity of asset Y (required)
- `--fee-a-to-b <number>` - Percentage fee for A to B swaps (0-100, required)
- `--fee-b-to-a <number>` - Percentage fee for B to A swaps (0-100, required)
- `--fee-from <string>` - Fee from option (required)

### swap

Performs a swap transaction in a pool.

```bash
bun run cli transaction swap \
  --share-asset-name <shareAssetName> \
  --quantity 1000000 \
  --direction aToB
```

**Options:**

- `-s, --share-asset-name <string>` - The share asset name of the pool (required)
- `-q, --quantity <number>` - The quantity of the asset to swap (required)
- `-d, --direction <string>` - The direction of the swap (`aToB` or `bToA`, default: `aToB`)

### add-liquidity

Adds liquidity to an existing pool.

```bash
bun run cli transaction add-liquidity \
  --share-asset-name <shareAssetName> \
  --quantity-a 1000000 \
  --quantity-b 2000000
```

**Options:**

- `-s, --share-asset-name <string>` - The share asset name of the pool (required)
- `-a, --quantity-a <number>` - The quantity of asset A to add (required)
- `-b, --quantity-b <number>` - The quantity of asset B to add (required)

### withdraw-liquidity

Withdraws liquidity from a pool.

```bash
bun run cli transaction withdraw-liquidity \
  --share-asset-name <shareAssetName> \
  --quantity 1000000
```

**Options:**

- `-s, --share-asset-name <string>` - The share asset name of the pool (required)
- `-q, --quantity <number>` - The quantity of shares to withdraw (required)

For more detailed documentation on CLI options and usage, run any command with the `--help` flag.

## tRPC Client

The SDK provides a tRPC client for fetching data from the Rapid DEX backend.

### Creating a tRPC Client

```typescript
import {createTRPCClient} from '@wingriders/rapid-dex-sdk-core'

// For server-side usage
const trpc = createTRPCClient({
  type: 'server',
  serverUrl: 'https://api.rapid-dex.example.com',
})

// For browser usage (supports WebSocket subscriptions)
const trpc = createTRPCClient({
  type: 'browser',
  serverUrl: 'https://api.rapid-dex.example.com',
})
```

### Fetching Data

Once you have a tRPC client, you can query pool data:

```typescript
// Get pool information
const pool = await trpc.pool.query({
  shareAssetName: 'your-share-asset-name',
})

// Get pool UTxO
const poolUtxo = await trpc.poolUtxo.query({
  shareAssetName: 'your-share-asset-name',
})

// Get all pools
const pools = await trpc.pools.query()

// Get pool interactions
const interactions = await trpc.poolInteractions.query({
  shareAssetName: 'your-share-asset-name',
})

// Subscribe to pool UTxO updates (browser only)
trpc.onPoolUtxoUpdated.subscribe(
  {shareAssetName: 'your-share-asset-name'},
  {
    onData: (payload) => {
      console.log('Pool UTxO updated:', payload)
    },
  }
)
```

The tRPC client provides type-safe access to all backend endpoints. See the backend router type `ServerAppRouter` for the complete API surface.

## Publish new version to NPM

1. Bump the version in package.json
2. `bun run build`
3. `bun run prepare-package-json-for-publish`
4. `npm publish` (use the `--dry-run` flag for dry run). Alternatively, use `bun pm pack` to create _.tgz_ that can be installed locally for testing
5. `bun run restore-package-json-after-publish` (or revert package.json using git)
