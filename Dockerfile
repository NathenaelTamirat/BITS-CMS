# ─── Stage 1: Install dependencies ───────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ─── Stage 2: Build TypeScript ───────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

# ─── Stage 3: Lean production image ──────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache tini

RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 cms

COPY --from=deps --chown=cms:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=cms:nodejs /app/dist ./dist
COPY --chown=cms:nodejs package.json ./

USER cms

EXPOSE 3000

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/server.js"]
