# API Reference

The server exposes a **tRPC** API. Over HTTP:

- **GET** — `.query()` procedures. Input is JSON-stringified and sent as the `input` query parameter.
- **POST** — `.mutation()` procedures. Input is sent in the request body.

**Subscriptions** use the **WebSocket** transport.

The server router is built by `createServerRouter()` in `src/app-router.ts`. Base path for procedures: `server.<procedureName>` (e.g. `server.pool`, `server.pools`).

## submitTx

**HTTP:** `POST` (tRPC mutation)

**Input:** `string` — CBOR-encoded signed transaction (hex or base64 per client config).

**Output:** Promise resolved when the transaction is submitted to the node (Ogmios transaction submission). Rejects if the TxSubmission client is not initialized or submission fails.

## healthcheck

**HTTP:** `GET` (tRPC query)

**Input:** None.

**Output:** Object:

- `healthy`: boolean
- `isDbConnected`: boolean
- `isTokenMetadataFetched`: boolean
- `isTxSubmissionClientInitialized`: boolean
- `uptime`: number (process uptime in seconds)

Throws `INTERNAL_SERVER_ERROR` if `healthy` is false.

## pools

**HTTP:** `GET` (tRPC query)

**Input:** None.

**Output:** Array of pool objects. Each item includes:

- `validAt`: Date
- `shareAssetName`, `unitA`, `unitB`: identifiers
- `poolState`: `{ qtyA, qtyB, issuedShares, treasuryA, treasuryB }` (BigNumber-like)
- `feeFrom`, `swapFeePointsAToB`, `swapFeePointsBToA`, `treasuryFeePointsAToB`, `treasuryFeePointsBToA`, `treasuryAuthorityUnit`, `feeBasis`
- `tvlInAda`: total value locked in ADA (optional)

Pools are sorted (e.g. by TVL). Includes both confirmed and latest mempool state.

## pool

**HTTP:** `GET` (tRPC query)

**Input:** `{ shareAssetName: string }`

**Output:** Single pool object (same shape as one element of `pools`, without `validAt`).  
Throws `BAD_REQUEST` if the pool is not found.

## poolUtxo

**HTTP:** `GET` (tRPC query)

**Input:** `{ shareAssetName: string }`

**Output:** `{ utxo: UTxO, validAt: Date }` — the current pool UTxO (on-chain + mempool) and the time it was valid.  
Throws `BAD_REQUEST` if the pool UTxO is not found.

## tokensMetadata

**HTTP:** `POST` (tRPC mutation)

Uses mutation so the input array can be large without hitting GET URL limits.

**Input:** `string[]` — list of token subject (policy + name) strings.

**Output:** `Record<string, TokenMetadata>` — map from subject to metadata (name, decimals, description, etc.; `logo` is omitted). Only entries for subjects found in the cache are included.

## tokenMetadata

**HTTP:** `GET` (tRPC query)

**Input:** `string` — token subject (policy + name).

**Output:** `TokenMetadata | null` — metadata for that subject, or `null` if not in cache. `logo` is omitted.

## userInteractions

**HTTP:** `GET` (tRPC query)

**Input:**

- `stakeKeyHash`: string
- `onlyUnconfirmed`: boolean (optional) — if true, only mempool interactions are returned

**Output:** Array of `Interaction` objects for that stake key (swaps, add/withdraw liquidity, create pool, withdraw treasury, donate, etc.), sorted. Each has `txHash`, `slot` (if confirmed), `pool`, and type-specific fields.

## poolInteractions

**HTTP:** `GET` (tRPC query)

**Input:** `{ shareAssetName: string }`

**Output:** Array of `Interaction` objects for that pool (same shape as `userInteractions`).

## tvl

**HTTP:** `GET` (tRPC query)

**Input:** None.

**Output:** Single value — total value locked across all pools, expressed in ADA (BigNumber/serialized number).

## volume

**HTTP:** `GET` (tRPC query)

**Input:** `{ hoursOffset: number }` — lookback window in hours from now.

**Output:** Single value — total trading volume across all pools in the window, in ADA.

## poolsVolume

**HTTP:** `GET` (tRPC query)

**Input:** `{ hoursOffset: number }` — lookback window in hours from now.

**Output:** `Record<string, BigNumber>` — map from pool `shareAssetName` to volume in that window (ADA or ADA-equivalent).

## dailyActiveUsers

**HTTP:** `GET` (tRPC query)

**Input:** None.

**Output:** `number` — count of unique stake key hashes that had at least one pool interaction in the last 24 hours (confirmed + mempool).

## onPoolStateUpdated

**Transport:** WebSocket (tRPC subscription)

**Input:** None.

**Output:** Stream of payloads:

- `shareAssetName`: string
- `poolState`: PoolState
- `tvlInAda`: BigNumber | undefined
- `validAt`: Date

Emitted whenever a pool’s state is updated (e.g. swap, liquidity change).

## onPoolUtxoUpdated

**Transport:** WebSocket (tRPC subscription)

**Input:** `{ shareAssetName: string }` — only events for this pool are yielded.

**Output:** Stream of payloads:

- `shareAssetName`: string
- `utxo`: UTxO
- `validAt`: Date

Emitted when the pool UTxO for the given pool changes.

## onPoolCreated

**Transport:** WebSocket (tRPC subscription)

**Input:** None.

**Output:** Stream of payloads: `{ pool: Pool }` — same shape as one element of the `pools` array. Emitted when a new pool is created.

## onPoolRolledBack

**Transport:** WebSocket (tRPC subscription)

**Input:** None.

**Output:** Stream of payloads:

- `shareAssetName`: string
- `validAt`: Date

Emitted when a pool is rolled back (e.g. chain rollback, pool no longer present).

## onUserInteractionsUpdate

**Transport:** WebSocket (tRPC subscription)

**Input:** `{ stakeKeyHash: string }` — only events for this user are yielded.

**Output:** Stream of `Interaction` objects for the given stake key. Emitted when a new interaction is recorded for that user.

## onPoolInteractionsUpdate

**Transport:** WebSocket (tRPC subscription)

**Input:** `{ poolShareAssetName: string }` — only events for this pool are yielded.

**Output:** Stream of `Interaction` objects for the given pool. Emitted when a new interaction is recorded for that pool.

## Response-type changes for flexible swap fees, treasury fees, and zap in/out

The following features required **response-type changes only** (no new endpoints or input parameters). Affected responses: **pool**, **pools**, **onPoolStateUpdated**, **onPoolCreated**, and **Interaction** objects (e.g. **userInteractions**, **poolInteractions**, **onUserInteractionsUpdate**, **onPoolInteractionsUpdate**).

### Flexible swap fees

Pool responses no longer expose a single swap fee. They now include:

- **`swapFeePointsAToB`**, **`swapFeePointsBToA`** — direction-specific fee points (A→B and B→A).
- **`feeBasis`** — denominator for fee calculation (fee = feePoints / feeBasis). Allows arbitrary fractions (e.g. 0.3% with feeBasis 10000 and feePoints 30).
- **`feeFrom`** — which side the fee is taken from: `InputToken`, `OutputToken`, `TokenA`, or `TokenB`.

Clients must use these four fields together to compute swap amounts and fee deductions correctly.

### Treasury fees

Pool responses now include treasury-related fields so clients can apply treasury fees and support treasury withdrawals:

- **`treasuryFeePointsAToB`**, **`treasuryFeePointsBToA`** — treasury fee points per direction.
- **`treasuryAuthorityUnit`** — asset identifier for the treasury authority (used for withdraw-treasury).
- **`poolState.treasuryA`**, **`poolState.treasuryB`** — current treasury balances (already part of pool state).

Interaction responses can include type **`WITHDRAW_TREASURY`** with **`outA`** and **`outB`** (amounts withdrawn from the pool treasury to the user).

### Zap in / Zap out

No additional response fields were added specifically for zap. The same **pool** and **Interaction** shapes now carry the flexible fee and treasury fields above, which clients need to compute:

- **Zap in** — single-asset add liquidity (internal swap). **ADD_LIQUIDITY** interactions use **`lockA`**, **`lockB`**, **`earnedShares`**; for zap-in, one of `lockA` or `lockB` is zero.
- **Zap out** — withdraw liquidity to a single asset. **WITHDRAW_LIQUIDITY** interactions use **`lockShares`**, **`outA`**, **`outB`**; for zap-out, one of `outA` or `outB` is zero.

So the API changes for zap in/out are the same as for flexible swap fees and treasury fees: pool (and related) responses expose the full fee and treasury config needed to compute zap flows on the client.
