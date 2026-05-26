# Hotel OS

Guest super-app + staff companion app + management dashboard for hotels.

See [CLAUDE.md](./CLAUDE.md) for conventions and architecture.
See [`Prompt_HotelOS.js`](./Prompt_HotelOS.js) for the source PRD/task generator.

## Quickstart

```bash
pnpm install                                              # install workspace
cp .env.example .env                                      # fill in secrets
cp services/auth-service/.env.example services/auth-service/.env
pnpm docker:up                                            # postgres + redis (Docker required)
pnpm migrate                                              # apply Prisma migrations
pnpm seed                                                 # seed demo property + guests
pnpm dev                                                  # run all apps/services
```

## Database

Schema lives at [`services/auth-service/prisma/schema.prisma`](./services/auth-service/prisma/schema.prisma) — auth-service owns migrations; all other services share the same Postgres via `@prisma/client`.

```bash
pnpm migrate              # prisma migrate dev (creates migration + applies)
pnpm migrate:deploy       # prisma migrate deploy (CI/prod)
pnpm db:generate          # regenerate Prisma client after schema edits
pnpm db:studio            # open Prisma Studio (browse data)
pnpm db:reset             # ⚠ drop + recreate + re-seed
pnpm seed                 # populate demo property/rooms/menu/guests/reservations
```

Demo credentials (after `pnpm seed`):
- Staff: `manager@grandchennai.com` / `demo1234`
- Guest: `+919876543210` (any 6-digit OTP in dev mode)

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

- **T-01 complete** — monorepo scaffold, all service stubs, mobile/web/AI app shells, Docker Compose with Kong gateway, CI.
- **T-02 complete** — Prisma 6 schema (14 tables, 7 enums), seed script with Indian demo data, db management scripts.

Next: T-03 auth-service (OTP + JWT).
