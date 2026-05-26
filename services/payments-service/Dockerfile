FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.29.3 --activate
WORKDIR /repo

FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY packages/config/package.json ./packages/config/
COPY packages/types/package.json ./packages/types/
COPY services/payments-service/package.json ./services/payments-service/
RUN pnpm install --frozen-lockfile=false

FROM base AS build
COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/services/payments-service/node_modules ./services/payments-service/node_modules
COPY packages ./packages
COPY services/payments-service ./services/payments-service
WORKDIR /repo/services/payments-service
RUN pnpm build || echo "build skipped (stub)"

FROM node:20-alpine AS runtime
WORKDIR /app
COPY --from=build /repo/services/payments-service/dist ./dist
COPY --from=build /repo/services/payments-service/package.json ./
COPY --from=build /repo/node_modules ../node_modules
COPY --from=build /repo/services/payments-service/node_modules ./node_modules
EXPOSE 3007
CMD ["node", "dist/index.js"]
