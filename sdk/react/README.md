# Rapid DEX SDK React

## What is this library for?

The Rapid DEX SDK React is an extension over `@wingriders/rapid-dex-sdk-core` that provides React-specific functionality for interacting with Rapid DEX in React applications. This package depends on `@wingriders/rapid-dex-sdk-core` and adds:

- **React hooks** - Custom hooks for querying pool data with real-time updates
- **React components** - Components for managing live data subscriptions
- **tRPC integration** - React Query integration for type-safe data fetching

This SDK is designed for projects that want to interact with Rapid DEX in a React application, providing a seamless developer experience with automatic cache management and real-time updates.

## Installation

Install the package via NPM:

```bash
bun install @wingriders/rapid-dex-sdk-react
```

## Setup

### 1. Install Required Dependencies

Make sure you have the required peer dependencies installed:

```bash
bun install @tanstack/react-query @wingriders/rapid-dex-sdk-core
```

### 2. Configure TRPCProvider

Wrap your application with the `TRPCProvider` and `QueryClientProvider`:

```tsx
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {createTRPCClient} from '@wingriders/rapid-dex-sdk-core'
import {TRPCProvider} from '@wingriders/rapid-dex-sdk-react'
import {useState} from 'react'

const App = () => {
  const [queryClient] = useState(() => new QueryClient())
  const [trpcClient] = useState(() =>
    createTRPCClient({
      type: 'browser',
      serverUrl: 'https://api.rapid-dex.example.com',
    })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {/* Your app components */}
      </TRPCProvider>
    </QueryClientProvider>
  )
}
```

## Components

### `LivePoolsUpdate`

A component that automatically subscribes to pool state updates and keeps the pools query cache synchronized in real-time. This component handles:

- Pool state updates (reserves, TVL changes)
- New pool creation events
- Pool rollback events

**Usage:**

```tsx
import {LivePoolsUpdate} from '@wingriders/rapid-dex-sdk-react'

const App = () => {
  return (
    <>
      <LivePoolsUpdate />
      {/* Your app content */}
    </>
  )
}
```

**Note:** This component renders nothing (`null`) and only manages subscriptions. Place it once at the root of your application.

### `LiveUserInteractionsUpdates`

A component that subscribes to user interaction updates for a specific stake key hash. It automatically updates the user interactions query cache when interactions are confirmed or updated.

**Props:**

- `stakeKeyHash: string` - The stake key hash of the user to track
- `onInteractionConfirmed?: (interaction: Interaction) => void` - Optional callback when an interaction transitions from unconfirmed to confirmed

**Usage:**

```tsx
import {LiveUserInteractionsUpdates} from '@wingriders/rapid-dex-sdk-react'

const UserDashboard = ({stakeKeyHash}: {stakeKeyHash: string}) => {
  const handleInteractionConfirmed = (interaction: Interaction) => {
    console.log('Interaction confirmed:', interaction)
    // Show notification, update UI, etc.
  }

  return (
    <>
      <LiveUserInteractionsUpdates
        stakeKeyHash={stakeKeyHash}
        onInteractionConfirmed={handleInteractionConfirmed}
      />
      {/* Your dashboard content */}
    </>
  )
}
```

**Note:** This component renders nothing (`null`) and only manages subscriptions.

## Queries

The SDK provides React Query hooks for fetching pool data with automatic real-time updates.

### `usePoolsQuery`

Fetches all available liquidity pools. The query automatically merges new pools and updates existing ones based on `validAt` timestamps.

**Usage:**

```tsx
import {usePoolsQuery} from '@wingriders/rapid-dex-sdk-react'

const PoolsList = () => {
  const {data: pools, isLoading, error} = usePoolsQuery()

  if (isLoading) return <div>Loading pools...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <ul>
      {pools?.map((pool) => (
        <li key={pool.shareAssetName}>
          {pool.unitA} / {pool.unitB} - TVL: {pool.tvlInAda} ADA
        </li>
      ))}
    </ul>
  )
}
```

**Options:**

- `enabled?: boolean` - Control whether the query is enabled (default: `true`)

**Returns:** Standard React Query result with pool data

### `useLivePoolUtxoQuery`

Fetches the current UTxO of a specific liquidity pool. The query automatically updates in real-time when the pool UTxO changes on-chain or in the mempool.

**Usage:**

```tsx
import {useLivePoolUtxoQuery} from '@wingriders/rapid-dex-sdk-react'

const PoolDetails = ({shareAssetName}: {shareAssetName: string}) => {
  const {data: poolUtxo, isLoading} = useLivePoolUtxoQuery({
    shareAssetName,
  })

  if (isLoading) return <div>Loading pool UTxO...</div>

  return (
    <div>
      <p>Pool UTxO: {poolUtxo?.utxo.txHash}</p>
      <p>Valid at: {poolUtxo?.validAt.toISOString()}</p>
    </div>
  )
}
```

**Parameters:**

- `input: { shareAssetName: string } | typeof skipToken` - Pool share asset name, or `skipToken` to disable the query

**Returns:** React Query result with `{ utxo: Utxo, validAt: Date }`

**Note:** The query is automatically disabled if `skipToken` is passed or if `shareAssetName` is not provided.

### `useLivePoolInteractionsQuery`

Fetches interactions (swaps, liquidity additions/withdrawals) for a specific pool. The query automatically updates in real-time when new interactions occur.

**Usage:**

```tsx
import {useLivePoolInteractionsQuery} from '@wingriders/rapid-dex-sdk-react'

const PoolInteractions = ({shareAssetName}: {shareAssetName: string}) => {
  const {data: interactions, isLoading} = useLivePoolInteractionsQuery({
    shareAssetName,
  })

  if (isLoading) return <div>Loading interactions...</div>

  return (
    <ul>
      {interactions?.map((interaction) => (
        <li key={interaction.txHash}>
          {interaction.type} - {interaction.txHash}
          {interaction.slot
            ? ` (Confirmed at slot ${interaction.slot})`
            : ' (Pending)'}
        </li>
      ))}
    </ul>
  )
}
```

**Parameters:**

- `input: { shareAssetName: string } | typeof skipToken` - Pool share asset name, or `skipToken` to disable the query

**Returns:** React Query result with array of interactions

## tRPC Hook

### `useTRPC`

A hook that provides access to the tRPC client with React Query integration. This is used internally by the query hooks and components, but you can also use it directly for custom queries or mutations.

**Usage:**

```tsx
import {useTRPC} from '@wingriders/rapid-dex-sdk-react'

const CustomQuery = () => {
  const trpc = useTRPC()

  // Use trpc directly for custom queries
  const {data} = trpc.pool.useQuery({
    shareAssetName: 'your-share-asset-name',
  })

  return <div>{/* Your content */}</div>
}
```

**Note:** The `useTRPC` hook must be used within a `TRPCProvider` context.

## Complete Example

Here's a complete example showing how to set up and use the React SDK:

```tsx
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {createTRPCClient} from '@wingriders/rapid-dex-sdk-core'
import {
  LivePoolsUpdate,
  usePoolsQuery,
  TRPCProvider,
} from '@wingriders/rapid-dex-sdk-react'
import {useState} from 'react'

const App = () => {
  const [queryClient] = useState(() => new QueryClient())
  const [trpcClient] = useState(() =>
    createTRPCClient({
      type: 'browser',
      serverUrl: process.env.NEXT_PUBLIC_SERVER_URL || 'wss://api.example.com',
    })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        <LivePoolsUpdate />
        <PoolsList />
      </TRPCProvider>
    </QueryClientProvider>
  )
}

const PoolsList = () => {
  const {data: pools, isLoading} = usePoolsQuery()

  if (isLoading) return <div>Loading...</div>

  return (
    <div>
      <h1>Liquidity Pools</h1>
      {pools?.map((pool) => (
        <div key={pool.shareAssetName}>
          <h2>
            {pool.unitA} / {pool.unitB}
          </h2>
          <p>TVL: {pool.tvlInAda} ADA</p>
          <p>
            Reserves: {pool.poolState.qtyA} / {pool.poolState.qtyB}
          </p>
        </div>
      ))}
    </div>
  )
}
```

## Type Safety

The SDK is fully typed with TypeScript. All queries, components, and hooks are type-safe and will provide autocomplete and type checking in your IDE.

## Real-time Updates

The SDK automatically manages real-time updates through WebSocket subscriptions. When you use the live query hooks or components, data will update automatically when:

- Pool states change
- New pools are created
- Pools are rolled back
- Pool UTxOs are updated
- New interactions occur
- User interactions are confirmed

No manual polling or refetching is required - the SDK handles all cache updates automatically.

## Publish new version to NPM

1. Bump the version in package.json
2. `bun run build`
3. `bun run prepare-package-json-for-publish`
4. `npm publish` (use the `--dry-run` flag for dry run). Alternatively, use `bun pm pack` to create _.tgz_ that can be installed locally for testing
5. `bun run restore-package-json-after-publish` (or revert package.json using git)
