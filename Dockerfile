# Stage 1: Build
FROM oven/bun:latest AS builder

# Set working directory
WORKDIR /app

# Copy package.json và bun.lockb (nếu có)
COPY package.json bun.lock* ./
COPY prisma ./prisma

# Cài dependencies với Bun, bỏ qua lockfile nếu lỗi
RUN bun install --no-verify

# Copy toàn bộ mã nguồn (bao gồm prisma)
COPY . .

# Build Next.js app
RUN bun run build

# Stage 2: Runtime
FROM oven/bun:latest AS runner

# Set working directory
WORKDIR /app

# Copy file cần thiết từ builder
COPY --from=builder /app/package.json ./
COPY --from=builder /app/bun.lock* ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts* ./
COPY --from=builder /app/next.config.ts* ./

# Cài dependencies production
RUN bun install

# Biến môi trường
ENV PORT=3000

# Mở port
EXPOSE 3000

# Chạy app với Bun
CMD ["bun", "run", "start"]