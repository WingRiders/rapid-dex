# Rapid DEX analytics

## Total Value Locked (TVL)

TVL is reported for each individual pool and also for the whole DEX as a sum of TVL from all pools.

First, we calculate the ADA exchange rate for each asset based on the token ratio in pools:

$$
\text{exchangeRate}(\text{unit}, \text{pool}) =
\begin{cases}
\text{1} & \text{if unit} = \text{'lovelace'} \\
\frac{\text{pool.qtyA}}{\text{pool.qtyB}} & \text{if pool.unitA} = \text{'lovelace'} \text{ and } \text{pool.qtyA} > \text{adaThresholdToIgnoreExchangeRate} \\
\text{NaN} & \text{otherwise}
\end{cases}
$$

Where:

- $\text{exchangeRate}(\text{unit}, \text{pool})$ is the exchange rate between $\text{unit}$ and ADA in $\text{pool}$
- $\text{pool.unitA}$ represents the first token unit in the pool (either 'lovelace' or another token)
- $\text{pool.qtyA}$ is the quantity of the first token in the pool
- $\text{pool.qtyB}$ is the quantity of the second token in the pool
- $\text{adaThresholdToIgnoreExchangeRate}$ is a minimum threshold, currently set to 100 ADA

After we have exchange rates for all assets, we calculate the TVL of an ADA pool as:

$$
\text{tvl}(\text{pool}) = \text{pool.qtyA} \times \text{exchangeRate}(\text{pool.unitA}, \text{pool}) + \text{pool.qtyB} \times \text{exchangeRate}(\text{pool.unitB}, \text{pool})
$$

Where:

- $\text{tvl}(\text{pool})$ is the Total Value Locked for a specific pool in ADA
- $\text{pool.qtyA}$ is the quantity of the first token in the pool
- $\text{pool.qtyB}$ is the quantity of the second token in the pool
- $\text{pool.unitA}$ is the unit identifier of the first token
- $\text{pool.unitB}$ is the unit identifier of the second token
- $\text{exchangeRate}(\text{unit})$ is the exchange rate function defined above

For the calculation of TVL of a non-ADA pool, we use the liquidity pool with the highest TVL to calculate the exchange rate of both tokens.

## Volume

Trading volume is reported for each individual pool and also for the whole DEX as a sum of volumes from all pools.

For the calculation of trading volume, the `PoolOutput` table in the database has these columns:

- `volumeA` - number of sold tokens when swapping A → B
- `volumeB` - number of sold tokens when swapping B → A
- `outputVolumeA` - number of received tokens when swapping B → A
- `outputVolumeB` - number of received tokens when swapping A → B

The calculation of trading volume in a specific interval sums all these fields from all `PoolOutput` entries that were created during that interval:

$$
\text{volume}(\text{pool}, \text{from}, \text{to}) = \sum_{\text{entry} \in \text{poolOutputEntries}(\text{pool}, \text{from}, \text{to})} \text{entry}
$$

Where:

- $\text{volume}(\text{pool}, \text{from}, \text{to})$ is the total trading volume for a pool over the specified time period
- $\text{poolOutputEntries}(\text{pool}, \text{from}, \text{to})$ is the set of all `PoolOutput` entries for the given pool created between times $\text{from}$ and $\text{to}$

## Daily active users

Each `PoolOutput` database entry has a `createdByStakeKeyHash` field, which is the staking part of the address of the user that interacted with the pool.

When calculating the daily active users in the last 24 hours, we simply count the number of unique `createdByStakeKeyHash`es in the `PoolOutput` entries created in the last 24 hours:

$$
\text{DAU}(t) = | \set{ \text{entry.createdByStakeKeyHash} \mid \text{entry} \in \text{PoolOutput}, t - 24h \leq \text{entry.createdAt} \leq t } |
$$

Where:

- $\text{DAU}(t)$ is the number of daily active users at time $t$
- $| \cdot |$ denotes the cardinality (size) of a set
- The set contains all unique stake key hashes from entries created within the last 24 hours

## Number of pools

The number of pools is calculated as the number of `PoolOutput` entries that are not spent (their `spendSlot` is set to `null`):

$$
\text{numberOfPools} = | \set{ \text{entry} \mid \text{entry} \in \text{PoolOutput}, \text{entry.spendSlot} = \text{null} } |
$$

Where:

- $\text{numberOfPools}$ is the total number of active pools in the DEX
- $| \cdot |$ denotes the cardinality (size) of a set
- The set contains all `PoolOutput` entries that have not been spent (spendSlot is null)
