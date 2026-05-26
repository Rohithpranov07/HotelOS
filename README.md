# Hotel OS

Guest super-app + staff companion app + management dashboard for hotels.

See [CLAUDE.md](./CLAUDE.md) for conventions and architecture.
See [`Prompt_HotelOS.js`](./Prompt_HotelOS.js) for the source PRD/task generator.

## Quickstart

```bash
pnpm install              # install workspace
cp .env.example .env      # fill in secrets as needed
pnpm docker:up            # postgres + redis (Docker required)
pnpm dev                  # run all apps/services via turborepo
```

## Workspace layout

```
hotel-os/
├── apps/
│   ├── mobile/       Expo + NativeWind + Zustand + React Query + Reanimated
│   ├── web/          Next.js 14 dashboard
│   └── ai-service/   Python FastAPI (Claude + Pinecone RAG)
├── services/
│   ├── auth-service/      :3001
│   ├── booking-service/   :3002
│   ├── orders-service/    :3003
│   ├── access-service/    :3004
│   ├── loyalty-service/   :3005
│   └── payments-service/  :3007
├── packages/
│   ├── types/    Shared Zod schemas + AppError
│   ├── ui/       Shared RN components + theme
│   └── config/   ESLint/TS/Prettier base
└── infra/docker/kong.yml
```

## Status

**T-01 complete** — monorepo scaffold, all service stubs, mobile/web/AI app shells, Docker Compose with Kong gateway, CI.

Next: T-02 Prisma schema + migrations.
