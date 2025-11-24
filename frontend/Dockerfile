FROM oven/bun:1.3.3 AS builder

ARG NEXT_PUBLIC_NETWORK
ENV NEXT_PUBLIC_NETWORK=$NEXT_PUBLIC_NETWORK

WORKDIR /app

COPY package.json bun.lock ./
COPY common ./common
COPY sdk ./sdk
COPY backend ./backend
COPY frontend ./frontend

# Install Python (required for building native dependencies)
RUN apt-get update && \
    apt-get install -y python3 && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install all dependencies for build
RUN bun install --frozen-lockfile

RUN bun run --filter ./backend prisma:generate
RUN bun run --filter ./frontend build

# Install only production dependencies after build
RUN bun install --production --frozen-lockfile

FROM oven/bun:1.3.3-slim

# Install wget
RUN apt-get update && \
    apt-get install -y wget && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules

COPY --from=builder /app/common/package.json ./common/package.json
COPY --from=builder /app/common/node_modules ./common/node_modules
COPY --from=builder /app/common/src ./common/src

COPY --from=builder /app/sdk/core/package.json ./sdk/core/package.json
COPY --from=builder /app/sdk/core/node_modules ./sdk/core/node_modules
COPY --from=builder /app/sdk/core/src ./sdk/core/src

COPY --from=builder /app/sdk/react/package.json ./sdk/react/package.json
COPY --from=builder /app/sdk/react/node_modules ./sdk/react/node_modules
COPY --from=builder /app/sdk/react/src ./sdk/react/src

COPY --from=builder /app/frontend/package.json ./frontend/package.json
COPY --from=builder /app/frontend/node_modules ./frontend/node_modules
COPY --from=builder /app/frontend/.next ./frontend/.next
COPY --from=builder /app/frontend/next.config.ts ./frontend/next.config.ts
COPY --from=builder /app/frontend/public ./frontend/public

WORKDIR /app/frontend

CMD ["bun", "run", "start"]
