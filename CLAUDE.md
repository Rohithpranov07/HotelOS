# Hotel OS — Claude Code Conventions

## Structure
- `apps/mobile` — React Native 0.74 + Expo SDK 51 (guest + staff app in one codebase, role-gated)
- `apps/web` — Next.js 14 App Router management dashboard
- `apps/ai-service` — Python 3.12 + FastAPI (Claude + Pinecone RAG)
- `services/*` — Node.js 20 + Fastify v4 microservices (auth, booking, orders, access, loyalty, payments)
- `packages/types` — Shared Zod schemas + TypeScript types (single source of truth)
- `packages/ui` — Shared React Native UI components
- `packages/config` — Shared ESLint, TS, and Prettier configs

## Stack
- **Backend**: Fastify v4, Prisma, PostgreSQL 16, Redis 7, BullMQ, Socket.io, Kong gateway
- **Mobile**: Expo 51, React Native 0.74, NativeWind (Tailwind for RN), Zustand, React Query (TanStack), Reanimated 3, MMKV
- **Web**: Next.js 14 App Router, Tailwind, Recharts, NextAuth, SWR
- **AI**: Python 3.12, FastAPI, LangChain, Anthropic SDK, OpenAI embeddings, Pinecone

## Code conventions
- TypeScript strict mode everywhere. Never use `any`.
- Validate ALL inputs with Zod before any business logic.
- Service handler pattern: validate → check auth/permissions → business logic → emit BullMQ event → respond
- No raw SQL. Prisma ORM only for all database operations (except read-only analytics views).
- All async background work via BullMQ. Never await slow operations in request handlers.
- Errors: throw typed `AppError` from `@hotel-os/types`.
- Logging: Pino with structured JSON. Never `console.log` in production code.
- Tests: Vitest for Node services, Pytest for Python. Every exported function needs at least one test.

## Mobile conventions (apps/mobile)
- NativeWind (`jsxImportSource: 'nativewind'`) intercepts the `style` prop on every component. NEVER use the function form `style={({ pressed }) => [...]}` — NativeWind drops it and the component loses its own margin/padding/background/border/flexDirection (collapses to a default full-width column). Always pass a static object/array: `style={[styles.card, disabled && { opacity: 0.4 }]}`. For pressed feedback use state or Reanimated, not the `style` callback.

## API conventions
- Base path: `/api/v1`
- All timestamps: ISO 8601 UTC strings
- All IDs: UUID v4 strings
- Pagination: `{ data: [...], meta: { page, per_page, total } }`
- Errors: `{ error: { code: string, message: string, details?: any[] } }`

## Running locally
```bash
pnpm install            # install workspace
pnpm docker:up          # starts postgres + redis (+ services if built)
pnpm dev                # starts all apps/services via turborepo
pnpm --filter auth-service exec prisma migrate dev   # run prisma migrations
pnpm seed:demo          # seed demo property + guests
```

## Service ports
| Service          | Port |
|------------------|------|
| auth-service     | 3001 |
| booking-service  | 3002 |
| orders-service   | 3003 |
| access-service   | 3004 |
| loyalty-service  | 3005 |
| ai-service       | 3006 |
| payments-service | 3007 |
| web (dashboard)  | 3000 |
| postgres         | 5432 |
| redis            | 6379 |
| kong proxy       | 8000 |
| kong admin       | 8001 |
