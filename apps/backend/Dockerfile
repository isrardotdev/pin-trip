# ── Stage 1: Builder ────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

RUN apk add --no-cache python3 openssl

RUN npm install -g pnpm@11.2.2

WORKDIR /app

# Copy manifests first — Docker caches this layer until deps change
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/backend/package.json ./apps/backend/

RUN pnpm install --frozen-lockfile

COPY packages/shared ./packages/shared
COPY apps/backend ./apps/backend

WORKDIR /app/apps/backend

RUN npx prisma generate
RUN pnpm build

# ── Stage 2: Runner ─────────────────────────────────────────────────────────
FROM node:22-alpine AS runner

# yt-dlp: always pull latest — Instagram breaks pinned versions
RUN apk add --no-cache ffmpeg python3 curl openssl && \
    curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
         -o /usr/local/bin/yt-dlp && \
    chmod a+rx /usr/local/bin/yt-dlp

RUN npm install -g pnpm@11.2.2

WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/backend/package.json ./apps/backend/

# Production deps only (prisma CLI is in dependencies, needed for migrate deploy)
RUN pnpm install --frozen-lockfile --prod

# Copy compiled JS + Prisma schema from builder
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/prisma ./apps/backend/prisma
COPY packages/shared ./packages/shared

# Generate Prisma client for this environment (both stages use the same alpine base so binary target matches)
RUN cd apps/backend && npx prisma generate

RUN mkdir -p /tmp/wanderpin

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD curl -f http://localhost:4000/api/health || exit 1

EXPOSE 4000
CMD ["node", "apps/backend/dist/apps/backend/src/index.js"]
