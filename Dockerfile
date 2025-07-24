# Ultra-lightweight multi-stage build for Next.js
FROM node:24-alpine AS base

# Install only essential dependencies
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Dependencies installer stage - skip postinstall
# FROM base AS deps
# Copy package files
# COPY package.json package-lock.json* ./

# Install production dependencies only, skip postinstall scripts
# RUN npm ci --omit=dev --omit=optional --no-audit --no-fund --ignore-scripts && \
#     npm cache clean --force

# Builder stage - use Debian for better compatibility
FROM node:24 AS builder
WORKDIR /app

# Copy package files and source code first
COPY package.json package-lock.json* ./
COPY . .

# Add build arg and env for Prisma
ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL

# Install all dependencies for building (with postinstall working now)
RUN npm ci --no-audit --no-fund

# Explicitly install Lightning CSS and rebuild native deps
RUN npm install --force lightningcss && npm rebuild

# Generate Prisma client (lightweight)
RUN npx prisma generate --schema=./prisma/schema.prisma

# Build Next.js (standalone mode)
ENV NODE_ENV=production
RUN npm run build

# Prune dev dependencies
RUN npm prune --omit=dev && npm cache clean --force

# Ultra-lightweight production stage with distroless
FROM gcr.io/distroless/nodejs24-debian12 AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copy only production node_modules (without build tools)
COPY --from=builder /app/node_modules ./node_modules

# Copy built Next.js standalone app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy only essential Prisma runtime files (not CLI)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Use non-root user (distroless already provides this)
USER 65534

EXPOSE 3000

# Run the standalone server
CMD ["server.js"]