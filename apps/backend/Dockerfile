FROM node:20-alpine

# yt-dlp + ffmpeg (audio extraction)
RUN apk add --no-cache ffmpeg yt-dlp openssl

# pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy workspace manifests first for layer caching
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/backend/package.json ./apps/backend/

RUN pnpm install --frozen-lockfile

# Copy source
COPY packages/shared ./packages/shared
COPY apps/backend ./apps/backend

WORKDIR /app/apps/backend
RUN npx prisma generate

EXPOSE 4000
CMD ["pnpm", "dev"]
