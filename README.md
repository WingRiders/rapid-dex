# Rapid DEX

A Cardano AMM DEX with direct pool interactions that eliminates batchers. This enables instant trade execution, removes slippage, reduces fees, and improves user gains and decentralization.

## Development

### Bun

This project uses [Bun](https://bun.sh/) as both the package manager and runtime. If you don't have Bun installed, you can follow the installation guide on their website.

This monorepo consists of the following workspaces:

- `common` - Common code shared between backend and frontend
- `backend` - A Bun application that aggregates blockchain data, stores it in a database, and provides endpoints via tRPC
- `frontend` - A Next.js application that provides the user interface for Rapid DEX

### Development

#### Install dependencies

```
bun install
```

#### Run lint

```
bun run check
```

#### Run tests

```
bun run test
```

#### Build all applications

```
bun run build
```

#### Run the application

To run the application locally, you need to run both the [backend](./backend/README.md) and [frontend](./frontend/README.md). You can follow the instructions in their respective README files to see how to run each application.
