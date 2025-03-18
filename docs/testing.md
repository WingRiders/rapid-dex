# Testing the contracts on Cardano testnet

This document provides detailed instructions on how to use Rapid DEX CLI tool for interacting with Cardano smart contracts.
The CLI allows users to create and submit transactions for creating a liquidity pool, swapping tokens, adding liquidity, and withdrawing liquidity.

## Prerequisites

Before running the CLI commands, ensure you have the following:

- A **Blockfrost Project ID** for the Cardano preprod testnet
- A **mnemonic phrase** for a funded preprod wallet
- **Bun** installed on your system ([installation guide](https://bun.sh/))
- Clone the Rapid DEX repository and install dependencies:

  ```sh
  git clone https://github.com/WingRiders/rapid-dex.git
  cd rapid-dex
  bun install
  ```

## CLI commands

The CLI tool is located in the `frontend/cli` directory. You can execute commands using:

```sh
$ bun cli <command> [options]
```

### 1. Create pool

This command creates a new liquidity pool on the preprod testnet.

```sh
$ bun cli create-pool --blockfrostProjectId <project_id> \
    --mnemonic "<mnemonic_phrase>" \
    --unitA lovelace --quantityA 1000000 \
    --unitB <asset_unit> --quantityB 1000000 \
    --swapFeePoints 4 --feeBasis 100
```

#### Example output:
```
Init wallet
Fetching addresses
Fetching UTxOs
Found 67 UTxOs
Building transaction with outShares = 999000, shareAssetName = <generated_asset_name>
{
  txFee: 457163,
} Signing transaction
{
  txSize: 3487,
} Submitting transaction
Transaction submitted with hash: <transaction_hash>
```

Save the `shareAssetName` from the output, as it will be needed for subsequent commands.

### 2. Swap

```sh
$ bun cli swap --blockfrostProjectId <project_id> \
    --mnemonic "<mnemonic_phrase>" \
    --shareAssetName <generated_asset_name> \
    --quantityX 1000
```

#### Example output:
```
Init wallet
Fetching addresses
Fetching UTxOs
Found 67 UTxOs
Building transaction with outY = 959
{
  txFee: 462084,
} Signing transaction
{
  txSize: 815,
} Submitting transaction
Transaction submitted with hash: <transaction_hash>
```

### 3. Add liquidity

```sh
$ bun cli add-liquidity --blockfrostProjectId <project_id> \
    --mnemonic "<mnemonic_phrase>" \
    --shareAssetName <generated_asset_name> \
    --quantityA 1000 --quantityB 1000
```

#### Example output:
```
Init wallet
Fetching addresses
Fetching UTxOs
Found 67 UTxOs
Building transaction with earnedShares = 999
{
  txFee: 466821,
} Signing transaction
{
  txSize: 923,
} Submitting transaction
Transaction submitted with hash: <transaction_hash>
```

### 4. Withdraw liquidity

```sh
$ bun cli withdraw-liquidity --blockfrostProjectId <project_id> \
    --mnemonic "<mnemonic_phrase>" \
    --shareAssetName <generated_asset_name> \
    --quantityShares 1000
```

#### Example output:
```
Init wallet
Fetching addresses
Fetching UTxOs
Found 66 UTxOs
Building transaction with outA = 1001, outB = 999
{
  txFee: 579220,
} Signing transaction
{
  txSize: 3486,
} Submitting transaction
Transaction submitted with hash: <transaction_hash>
```

## Notes

- Ensure that you replace `<project_id>`, `<mnemonic_phrase>`, `<asset_unit>`, and `<generated_asset_name>` with the appropriate values.
- Transactions may take some time to be confirmed on-chain. You can monitor transaction status using [Cardanoscan](https://preprod.cardanoscan.io/) or [Cexplorer](https://cexplorer.io/).
- If a transaction fails, check that your wallet has sufficient funds and that the provided parameters are correct.
