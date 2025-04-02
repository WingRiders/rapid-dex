FROM oven/bun:1.2.8 AS builder

WORKDIR /app

COPY package.json bun.lock ./
COPY common ./common
COPY backend ./backend
COPY frontend ./frontend
COPY patches patches

# Install all dependencies for build
RUN bun install --frozen-lockfile

RUN bun run --filter ./backend prisma:generate
RUN bun run --filter ./frontend build

# Install only production dependencies after build
RUN bun install --production --frozen-lockfile

FROM oven/bun:1.2.8-slim

# Install wget
RUN apt-get update && \
    apt-get install -y wget && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /app/frontend/.next ./.next
COPY --from=builder /app/frontend/public ./public
COPY --from=builder /app/frontend/package.json ./package.json
COPY --from=builder /app/frontend/next.config.ts ./next.config.ts
COPY --from=builder /app/node_modules ./node_modules

CMD ["bun", "run", "start"]
