# syntax=docker/dockerfile:1

# Build from the backend project root (where package.json lives):
#   docker build --platform linux/amd64 -t gxp-backend ./Backend

# -----------------------------------------------------------------------------
# Stage 1: deps — all dependencies (incl. dev), cached on package*.json only.
# -----------------------------------------------------------------------------
FROM node:20-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# -----------------------------------------------------------------------------
# Stage 2: build — compile TypeScript src/ -> dist/
# -----------------------------------------------------------------------------
FROM node:20-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# -----------------------------------------------------------------------------
# Stage 3: prod-deps — production dependencies only.
# -----------------------------------------------------------------------------
FROM node:20-slim AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# -----------------------------------------------------------------------------
# Stage 4: runtime
# -----------------------------------------------------------------------------
FROM node:20-slim AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# tini reaps zombies and forwards SIGTERM so the pg pool can close cleanly.
RUN apt-get update \
 && apt-get install -y --no-install-recommends tini \
 && rm -rf /var/lib/apt/lists/*

RUN groupadd --system appgroup && useradd --system --gid appgroup appuser

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
# package.json is required at runtime for "type": "module" resolution.
COPY package.json ./

# No .env in the image. config.ts looks for /app/.env, finds nothing, and
# falls through to process.env — all runtime config comes from environment
# variables injected by the hosting platform.

USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://localhost:'+(process.env.PORT||3000)+'/healthz').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "dist/server.js"]