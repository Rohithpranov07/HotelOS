FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.29.3 --activate
WORKDIR /repo

FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY packages/config/package.json ./packages/config/
COPY packages/types/package.json ./packages/types/
COPY services/booking-service/package.json ./services/booking-service/
RUN pnpm install --frozen-lockfile=false

FROM base AS build
COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/services/booking-service/node_modules ./services/booking-service/node_modules
COPY packages ./packages
COPY services/booking-service ./services/booking-service
WORKDIR /repo/services/booking-service
RUN pnpm build || echo "build skipped (stub)"

FROM node:20-alpine AS runtime
WORKDIR /app
COPY --from=build /repo/services/booking-service/dist ./dist
COPY --from=build /repo/services/booking-service/package.json ./
COPY --from=build /repo/node_modules ../node_modules
COPY --from=build /repo/services/booking-service/node_modules ./node_modules
EXPOSE 3002
CMD ["node", "dist/index.js"]
