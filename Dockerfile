# ─── Production image ────────────────────────────────────────────────
FROM node:alpine AS production

RUN apk add --no-cache tzdata
ENV TZ=Asia/Tashkent
ENV NODE_ENV=production

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

# Copy application source
COPY src ./src

CMD ["node", "src/index.js"]
