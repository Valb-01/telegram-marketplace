FROM node:20-alpine AS base
RUN npm install -g pnpm

# ── Builder ───────────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# ── Production ────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
RUN npm install -g pnpm
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Create uploads directory
RUN mkdir -p uploads/thumbnails

EXPOSE 3001

CMD ["node", "dist/index.js"]
