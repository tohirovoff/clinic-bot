# ─── Stage 1: Build native dependencies ──────────────────────────────
FROM node:alpine AS builder

WORKDIR /app

# Install build tools required by better-sqlite3
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci --omit=dev

# ─── Stage 2: Production image ────────────────────────────────────────
FROM node:alpine AS production

RUN apk add --no-cache tzdata
ENV TZ=Asia/Tashkent
ENV NODE_ENV=production

WORKDIR /app

# Copy compiled node_modules from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy application source
COPY src ./src
COPY package.json ./

CMD ["node", "src/index.js"]
