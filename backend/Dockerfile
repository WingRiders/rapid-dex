FROM oven/bun:1.2.8 AS base
WORKDIR /app

# This will cache installed dependencies and speed up future builds
FROM base AS install

COPY package.json bun.lock ./
COPY common/package.json common/package.json
COPY backend/package.json backend/package.json
COPY backend/prisma backend/prisma
COPY frontend/package.json frontend/package.json
COPY patches patches
RUN bun install --frozen-lockfile --production # exclude devDependencies
RUN bun run --filter ./backend prisma:generate

# Copy dependencies and source code into final image
FROM base AS release

# Install wget and ca-certificates
RUN apt-get update && \
    apt-get install -y wget ca-certificates && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

COPY --from=install /app/node_modules node_modules
COPY package.json ./
COPY common/package.json common/package.json
COPY backend/package.json backend/package.json
COPY common/src common/src
COPY backend/src backend/src

ENV NODE_ENV=production
ENV DB_SSL_MODE=require
ENV DB_SSL_ACCEPT=strict
ENV DB_SSL_CERT=/usr/local/share/ca-certificates/rds.crt
ENV DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=${DB_SCHEMA}&sslmode=${DB_SSL_MODE}&sslaccept=${DB_SSL_ACCEPT}&sslcert=${DB_SSL_CERT}"

# Add the RDS certificate to the system
COPY ca-certificates/rds-global-bundle.pem $DB_SSL_CERT
RUN update-ca-certificates

ENTRYPOINT ["bun", "run", "--filter", "./backend", "start"]
