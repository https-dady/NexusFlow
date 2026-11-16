# syntax=docker/dockerfile:1

# ---- Build stage ----------------------------------------------------------
FROM node:22-alpine AS build

WORKDIR /app

# bcrypt may need to compile when a prebuilt binary is unavailable for musl.
RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json ./
COPY client/package.json ./client/package.json
COPY server/package.json ./server/package.json

RUN npm ci --no-audit --no-fund

COPY . .
RUN npm run build
RUN npm prune --omit=dev

# ---- Runtime stage --------------------------------------------------------
FROM node:22-alpine AS runtime

ENV NODE_ENV=production
ENV PORT=5000

WORKDIR /app

RUN addgroup -S nexusflow && adduser -S nexusflow -G nexusflow

COPY --from=build --chown=nexusflow:nexusflow /app/node_modules ./node_modules
COPY --from=build --chown=nexusflow:nexusflow /app/package.json ./package.json
COPY --from=build --chown=nexusflow:nexusflow /app/server/package.json ./server/package.json
COPY --from=build --chown=nexusflow:nexusflow /app/server/src ./server/src
COPY --from=build --chown=nexusflow:nexusflow /app/client/dist ./client/dist

USER nexusflow

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=25s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 5000) + '/api/v1/health').then((res) => process.exit(res.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "server/src/server.js"]
