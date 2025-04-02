# Rapid DEX backend

The Rapid DEX backend is a Bun application that:

- Aggregates pool transactions on the Cardano blockchain using Ogmios and stores the data in a Postgres database
- Provides endpoints for the aggregated data via [tRPC](https://trpc.io/)
- Fetches token metadata from the [cardano-token-registry](https://github.com/cardano-foundation/cardano-token-registry)

## Run the application

To run the Rapid DEX backend application, you need to have the following services running on your machine:

- Cardano node
- Ogmios
- Postgres database

You can use the `docker-compose.yml` configuration in `./docker` to easily run all services using Docker:

```bash
cd docker
cp .env.example .env
docker compose up cardano-node ogmios postgresql
```

The Cardano node will take some time to sync all the blockchain data. You can track the syncing status at http://localhost:1337.

After all the above-mentioned services are running, you can start the backend application. First, copy the example environment variables:

```bash
cp .env.example .env
```

Then run the application:

```
bun run dev
```
