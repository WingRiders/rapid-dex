# Deployment guide

This guide explains how to deploy the Rapid DEX smart contracts and interact with the Cardano blockchain using the provided CLI tools.

## Prerequisites

Before running the deployment script, ensure you have the following:

- [Bun](https://bun.sh/) installed
- A valid [Blockfrost](https://blockfrost.io/) API key
- A Cardano wallet mnemonic with sufficient funds for transaction fees

## Deploying the reference script UTxO

The following command initializes a Cardano wallet, fetches UTxOs, submits a transaction using a Plutus script to deploy a reference script on-chain, and writes the transaction hash to `refScriptUtxos/<network>.ts`.

### Usage

Run the following command, replacing placeholders with your actual values:

```sh
cd common
bun cli create-reference-script-utxo \
  --blockfrostProjectId <your_blockfrost_project_id> \
  --networkId <0 or 1> \
  --mnemonic "<your_mnemonic_phrase>" \
  --stakeKeyHash <your_stake_key_hash>
```

### Parameters
- `--blockfrostProjectId` – Your Blockfrost project ID.
- `--networkId` – Network ID (0 for Preprod, 1 for Mainnet).
- `--mnemonic` – Your wallet's mnemonic phrase.
- `--stakeKeyHash` – (Optional) Stake key hash used for the staking part of the pool address.

### Notes
- Ensure your wallet has enough funds to cover transaction fees.
- The script will deploy a reference script on-chain.
- After running the script, commit the changed `refScriptUtxos/<network>.ts` to the repository.

## Verifying the deployment

After deploying, you can verify the transaction on the Cardano testnet using [Cexplorer](https://preprod.cexplorer.io/):

1. Copy the transaction hash from the script output.
2. Open [Cexplorer](https://preprod.cexplorer.io/).
3. Paste the transaction hash into the search bar and verify the deployed script.

For additional troubleshooting, check the logs or ensure your wallet has enough ADA to cover transaction fees.
