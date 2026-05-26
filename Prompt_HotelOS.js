const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, VerticalAlign, PageNumber, PageBreak, LevelFormat,
  TableOfContents, TabStopType
} = require('docx');
const fs = require('fs');

const C = {
  navy:'1B2A4A', teal:'0F6E56', amber:'854F0B', coral:'993C1D',
  purple:'3C3489', blue:'185FA5', green:'27500A', red:'791F1F',
  white:'FFFFFF', light:'F4F6FA', mid:'DDE3EE', muted:'5A6170',
  border:'CCCCCC', codebg:'F0F2F5', dark:'0D1B2E',
};

const tbl=(c=C.border)=>{const b={style:BorderStyle.SINGLE,size:1,color:c};return{top:b,bottom:b,left:b,right:b}};
const none=()=>{const b={style:BorderStyle.NONE,size:0,color:'FFFFFF'};return{top:b,bottom:b,left:b,right:b}};

const r=(t,o={})=>new TextRun({text:t,font:'Arial',size:o.size||22,bold:o.bold||false,italics:o.italic||false,color:o.color||C.navy,...o});
const mono=(t,o={})=>new TextRun({text:t,font:'Courier New',size:o.size||18,color:o.color||C.purple,...o});

const p=(ch,o={})=>new Paragraph({children:Array.isArray(ch)?ch:[ch],alignment:o.align||AlignmentType.LEFT,spacing:{before:o.sb??80,after:o.sa??80,line:o.line||300},...o});
const h1=t=>new Paragraph({heading:HeadingLevel.HEADING_1,children:[r(t,{size:30,bold:true,color:C.navy})],spacing:{before:480,after:180},border:{bottom:{style:BorderStyle.SINGLE,size:8,color:C.teal,space:5}}});
const h2=t=>new Paragraph({heading:HeadingLevel.HEADING_2,children:[r(t,{size:25,bold:true,color:C.navy})],spacing:{before:320,after:140}});
const h3=t=>new Paragraph({heading:HeadingLevel.HEADING_3,children:[r(t,{size:22,bold:true,color:C.teal})],spacing:{before:220,after:100}});
const h4=t=>new Paragraph({heading:HeadingLevel.HEADING_4,children:[r(t,{size:21,bold:true,color:C.muted})],spacing:{before:160,after:80}});
const bod=(t,o={})=>p([r(t,{size:21,color:'2C3344',...o})],{sb:70,sa:70,line:310});
const pb=()=>new Paragraph({children:[new PageBreak()],spacing:{before:0,after:0}});
const sp=(n=100)=>new Paragraph({children:[r('')],spacing:{before:n,after:0}});
const bul=(t,lv=0)=>new Paragraph({numbering:{reference:'bullets',level:lv},children:[r(t,{size:20,color:'2C3344'})],spacing:{before:50,after:50}});

// Callout box
const callout=(label,text,color=C.blue,bg='EEF4FB')=>new Paragraph({
  children:[r(label+': ',{size:20,bold:true,color}),r(text,{size:20,color:'2C3344'})],
  shading:{fill:bg,type:ShadingType.CLEAR},spacing:{before:110,after:110},indent:{left:320},
  border:{left:{style:BorderStyle.SINGLE,size:14,color,space:8}},
});

// Code block — monospace with teal left border
const code=(text)=>{
  const lines=text.split('\n');
  return lines.map((line,i)=>new Paragraph({
    children:[mono(line||' ',{size:17,color:'1B3A5C'})],
    shading:{fill:C.codebg,type:ShadingType.CLEAR},
    spacing:{before:i===0?80:0,after:i===lines.length-1?80:0,line:240},
    indent:{left:280,right:280},
    border: i===0
      ? {left:{style:BorderStyle.SINGLE,size:14,color:C.teal,space:8},top:{style:BorderStyle.SINGLE,size:1,color:'D8DCE3'},right:{style:BorderStyle.SINGLE,size:1,color:'D8DCE3'}}
      : i===lines.length-1
      ? {left:{style:BorderStyle.SINGLE,size:14,color:C.teal,space:8},bottom:{style:BorderStyle.SINGLE,size:1,color:'D8DCE3'},right:{style:BorderStyle.SINGLE,size:1,color:'D8DCE3'}}
      : {left:{style:BorderStyle.SINGLE,size:14,color:C.teal,space:8},right:{style:BorderStyle.SINGLE,size:1,color:'D8DCE3'}},
  }));
};
const codeBlock=(text)=>code(text).flat();

// Info table (2 cols, header row)
const infoTbl=(rows,w1=2800)=>{
  const w2=9360-w1;
  return new Table({
    width:{size:9360,type:WidthType.DXA},columnWidths:[w1,w2],
    rows:rows.map(([a,b],i)=>new TableRow({children:[
      new TableCell({width:{size:w1,type:WidthType.DXA},borders:tbl(),shading:{fill:i===0?C.navy:i%2===0?C.light:C.white,type:ShadingType.CLEAR},margins:{top:70,bottom:70,left:130,right:100},children:[p([r(a,{size:19,bold:true,color:i===0?C.white:C.navy})])]}),
      new TableCell({width:{size:w2,type:WidthType.DXA},borders:tbl(),shading:{fill:i===0?C.mid:i%2===0?'F9FBFC':C.white,type:ShadingType.CLEAR},margins:{top:70,bottom:70,left:130,right:100},children:[p([r(b,{size:19,color:i===0?C.navy:'2C3344',bold:i===0})])]}),
    ]}))
  });
};

// Task header banner
const taskBanner=(num,title,phase,effort,color=C.teal)=>new Table({
  width:{size:9360,type:WidthType.DXA},columnWidths:[1400,5760,1200,1000],
  rows:[new TableRow({children:[
    new TableCell({width:{size:1400,type:WidthType.DXA},borders:none(),shading:{fill:color,type:ShadingType.CLEAR},margins:{top:140,bottom:140,left:180,right:120},children:[
      p([r('TASK',{size:17,bold:true,color:'AADECE'})],{sb:0,sa:20}),
      p([r(num,{size:28,bold:true,color:C.white})],{sb:0,sa:0}),
    ]}),
    new TableCell({width:{size:5760,type:WidthType.DXA},borders:none(),shading:{fill:color,type:ShadingType.CLEAR},margins:{top:120,bottom:120,left:200,right:120},children:[
      p([r(title,{size:24,bold:true,color:C.white})],{sb:0,sa:0}),
    ],verticalAlign:VerticalAlign.CENTER}),
    new TableCell({width:{size:1200,type:WidthType.DXA},borders:none(),shading:{fill:C.dark,type:ShadingType.CLEAR},margins:{top:120,bottom:120,left:160,right:120},children:[
      p([r('Phase',{size:17,color:'8BAFD4'})],{sb:0,sa:20}),
      p([r(phase,{size:20,bold:true,color:C.white})],{sb:0,sa:0}),
    ]}),
    new TableCell({width:{size:1000,type:WidthType.DXA},borders:none(),shading:{fill:C.dark,type:ShadingType.CLEAR},margins:{top:120,bottom:120,left:160,right:160},children:[
      p([r('Effort',{size:17,color:'8BAFD4'})],{sb:0,sa:20}),
      p([r(effort,{size:20,bold:true,color:C.white})],{sb:0,sa:0}),
    ]}),
  ]})]
});

// ═══════════════════════════════════════════════════════════
// ALL TASKS
// ═══════════════════════════════════════════════════════════

const tasks = [

// ─────────────────────────────────────────────────────────
{ num:'T-01', title:'Monorepo scaffold & toolchain setup', phase:'Phase 1 · Wk 1', effort:'1 day', color:C.navy,
  objective:'Bootstrap the entire Hotel OS monorepo with pnpm workspaces, Turborepo, TypeScript, ESLint, Prettier, Husky pre-commit hooks, and Docker Compose for local development. This is the foundation every other task builds on.',
  dependencies:'None — this is the first task.',
  outputs:['hotel-os/ monorepo root with turbo.json and pnpm-workspace.yaml','apps/mobile/ (Expo blank), apps/web/ (Next.js 14), apps/ai-service/ (FastAPI stub)','services/auth-service/, services/booking-service/, services/orders-service/, services/access-service/, services/loyalty-service/, services/payments-service/ — each with Fastify stub','packages/types/ (shared Zod + TS types), packages/config/ (ESLint + TS config), packages/ui/ (React Native components stub)','docker-compose.yml that spins up PostgreSQL 16, Redis 7, all services, and Kong gateway','GitHub Actions CI pipeline: lint → typecheck → test on every push to main','.env.example with all required variable names (no values)','CLAUDE.md at root with project conventions'],
  prompt:`You are building the Hotel OS monorepo from scratch. Create the complete project structure and toolchain.

## Project overview
Hotel OS is a mobile-first hotel super-app. It has a React Native guest/staff app, a Next.js management dashboard, a Python AI service, and 6 Node.js microservices. Everything lives in one monorepo.

## STEP 1 — Create root structure
Create the following directory and file structure exactly:

\`\`\`
hotel-os/
├── apps/
│   ├── mobile/
│   ├── web/
│   └── ai-service/
├── services/
│   ├── auth-service/
│   ├── booking-service/
│   ├── orders-service/
│   ├── access-service/
│   ├── loyalty-service/
│   └── payments-service/
├── packages/
│   ├── types/
│   ├── config/
│   └── ui/
├── infra/
│   ├── docker/
│   └── k8s/
├── scripts/
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
├── .env.example
├── .gitignore
├── CLAUDE.md
└── docker-compose.yml
\`\`\`

## STEP 2 — Root package.json
\`\`\`json
{
  "name": "hotel-os",
  "private": true,
  "packageManager": "pnpm@9.0.0",
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck",
    "migrate": "pnpm --filter auth-service exec prisma migrate dev",
    "migrate:deploy": "pnpm --filter auth-service exec prisma migrate deploy",
    "seed": "tsx scripts/seed.ts",
    "docker:up": "docker-compose up -d",
    "docker:down": "docker-compose down"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.4.0",
    "eslint": "^8.57.0",
    "@typescript-eslint/eslint-plugin": "^7.0.0",
    "@typescript-eslint/parser": "^7.0.0",
    "prettier": "^3.2.0",
    "husky": "^9.0.0",
    "lint-staged": "^15.0.0",
    "tsx": "^4.0.0"
  }
}
\`\`\`

## STEP 3 — turbo.json
\`\`\`json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**"] },
    "dev": { "cache": false, "persistent": true },
    "test": { "dependsOn": ["^build"] },
    "lint": {},
    "typecheck": { "dependsOn": ["^build"] }
  }
}
\`\`\`

## STEP 4 — packages/config/
Create packages/config/package.json, eslint.js (base ESLint config), typescript.json (base tsconfig), and prettier.js.

Base tsconfig:
\`\`\`json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleDetection": "force",
    "isolatedModules": true
  }
}
\`\`\`

## STEP 5 — packages/types/
Create packages/types/src/index.ts that exports:
- All Zod schemas for: Guest, Reservation, Order, LoyaltyTransaction, Staff, Room, Property
- All TypeScript types inferred from those schemas
- Enums: OrderType, OrderStatus, LoyaltyTier, ReservationStatus, StaffRole, RoomStatus

Example for Guest:
\`\`\`typescript
import { z } from 'zod';

export const LoyaltyTierEnum = z.enum(['bronze', 'silver', 'gold', 'platinum']);
export type LoyaltyTier = z.infer<typeof LoyaltyTierEnum>;

export const GuestSchema = z.object({
  id: z.string().uuid(),
  phone: z.string().regex(/^\\+[1-9]\\d{1,14}$/),
  fullName: z.string().min(1).max(200),
  email: z.string().email().optional(),
  languageCode: z.string().default('en'),
  loyaltyTier: LoyaltyTierEnum.default('bronze'),
  loyaltyPoints: z.number().int().min(0).default(0),
  dietaryFlags: z.array(z.string()).default([]),
  waOptIn: z.boolean().default(false),
  createdAt: z.string().datetime(),
});
export type Guest = z.infer<typeof GuestSchema>;
\`\`\`

Define similar schemas for ALL entities listed above.

## STEP 6 — Each service scaffold
For EACH service in services/, create:
- package.json with: fastify ^4, @fastify/cors, @fastify/jwt, zod, @hotel-os/types, pino
- tsconfig.json extending packages/config/typescript.json
- src/index.ts — Fastify app with health check endpoint GET /health → { status: 'ok', service: 'auth-service' }
- src/plugins/ — empty folder for Fastify plugins
- src/routes/ — empty folder for route modules

auth-service also needs: prisma, @prisma/client
Every service: vitest for testing

## STEP 7 — docker-compose.yml
\`\`\`yaml
version: '3.9'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: hoteldb
      POSTGRES_USER: hoteluser
      POSTGRES_PASSWORD: hotelpass
    ports:
      - "5432:5432"
    volumes:
      - pg_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U hoteluser -d hoteldb"]
      interval: 5s
      retries: 10

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --save "" --appendonly no

  auth-service:
    build: ./services/auth-service
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=postgresql://hoteluser:hotelpass@postgres:5432/hoteldb
      - REDIS_URL=redis://redis:6379
      - PORT=3001
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started

  booking-service:
    build: ./services/booking-service
    ports:
      - "3002:3002"
    environment:
      - DATABASE_URL=postgresql://hoteluser:hotelpass@postgres:5432/hoteldb
      - REDIS_URL=redis://redis:6379
      - PORT=3002
    depends_on:
      postgres:
        condition: service_healthy

  orders-service:
    build: ./services/orders-service
    ports:
      - "3003:3003"
    environment:
      - DATABASE_URL=postgresql://hoteluser:hotelpass@postgres:5432/hoteldb
      - REDIS_URL=redis://redis:6379
      - PORT=3003
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started

  access-service:
    build: ./services/access-service
    ports:
      - "3004:3004"
    environment:
      - DATABASE_URL=postgresql://hoteluser:hotelpass@postgres:5432/hoteldb
      - REDIS_URL=redis://redis:6379
      - PORT=3004

  loyalty-service:
    build: ./services/loyalty-service
    ports:
      - "3005:3005"
    environment:
      - DATABASE_URL=postgresql://hoteluser:hotelpass@postgres:5432/hoteldb
      - PORT=3005

  payments-service:
    build: ./services/payments-service
    ports:
      - "3007:3007"
    environment:
      - DATABASE_URL=postgresql://hoteluser:hotelpass@postgres:5432/hoteldb
      - PORT=3007

volumes:
  pg_data:
\`\`\`

## STEP 8 — .env.example
Create .env.example with ALL required variable names (no real values):
\`\`\`
DATABASE_URL=postgresql://hoteluser:hotelpass@localhost:5432/hoteldb
REDIS_URL=redis://localhost:6379
JWT_PRIVATE_KEY=
JWT_PUBLIC_KEY=
JWT_ACCESS_TTL=900
JWT_REFRESH_TTL=2592000
FIREBASE_SERVICE_ACCOUNT=
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
PINECONE_API_KEY=
PINECONE_INDEX_NAME=hotel-knowledge-base
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
CLOUDBEDS_API_KEY=
SENDGRID_API_KEY=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=
\`\`\`

## STEP 9 — CLAUDE.md at root
Create CLAUDE.md with this exact content:
\`\`\`markdown
# Hotel OS — Claude Code Conventions

## Structure
- apps/mobile — React Native 0.74 + Expo SDK 51 (guest + staff app in one codebase)
- apps/web — Next.js 14 App Router dashboard
- apps/ai-service — Python 3.12 + FastAPI
- services/* — Node.js 20 + Fastify v4 microservices
- packages/types — Shared Zod schemas + TypeScript types (single source of truth)

## Code conventions
- TypeScript strict mode everywhere. Never use \`any\`.
- Validate ALL inputs with Zod before any business logic.
- Service handler pattern: validate → check auth/permissions → business logic → emit BullMQ event → respond
- No raw SQL. Prisma ORM only for all database operations.
- All async background work via BullMQ. Never await slow operations in request handlers.
- Errors: always throw typed errors using the AppError class from packages/types
- Logging: Pino with structured JSON. Never console.log in production code.
- Tests: Vitest for services. Every exported function needs at least one test.

## API conventions
- Base path: /api/v1
- All timestamps: ISO 8601 UTC strings
- All IDs: UUID v4 strings
- Pagination: { data: [...], meta: { page, per_page, total } }
- Errors: { error: { code: string, message: string, details?: any[] } }

## Running locally
pnpm docker:up     # starts postgres + redis
pnpm dev           # starts all services via turborepo
pnpm migrate       # runs prisma migrations
pnpm seed          # seeds demo data
\`\`\`

## STEP 10 — GitHub Actions CI
Create .github/workflows/ci.yml:
\`\`\`yaml
name: CI
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test
\`\`\`

## Acceptance criteria
- \`pnpm install\` completes with no errors
- \`pnpm typecheck\` passes for all packages and services
- \`pnpm lint\` passes with zero errors
- \`docker-compose up -d\` starts postgres and redis successfully
- Each service's GET /health returns { status: 'ok', service: '{name}' }
- All shared types in packages/types compile and export correctly`
},

// ─────────────────────────────────────────────────────────
{ num:'T-02', title:'PostgreSQL schema & Prisma migrations', phase:'Phase 1 · Wk 1', effort:'1 day', color:C.navy,
  objective:'Create the complete Prisma schema for all Hotel OS database tables and run the initial migration. This defines the entire data model that all services will use.',
  dependencies:'T-01 must be complete. PostgreSQL must be running.',
  outputs:['services/auth-service/prisma/schema.prisma — complete schema','services/auth-service/prisma/migrations/001_initial/ migration files','Seed script at scripts/seed.ts with demo property, rooms, staff, and guest data'],
  prompt:`Create the complete Prisma database schema for Hotel OS and run the initial migration.

## Working directory
Work inside services/auth-service/ — this service owns the Prisma schema and all migrations. Other services connect to the same database but do NOT have their own Prisma schemas.

## STEP 1 — Install dependencies
\`\`\`bash
cd services/auth-service
pnpm add prisma @prisma/client
pnpm exec prisma init
\`\`\`

## STEP 2 — Create prisma/schema.prisma
Replace the generated schema with this complete schema:

\`\`\`prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── ENUMS ────────────────────────────────────────────────

enum LoyaltyTier {
  bronze
  silver
  gold
  platinum
}

enum ReservationStatus {
  confirmed
  pre_checked_in
  checked_in
  checked_out
  cancelled
  no_show
}

enum OrderType {
  food
  beverage
  laundry
  housekeeping
  amenity
  maintenance
  spa
}

enum OrderStatus {
  pending
  accepted
  in_progress
  completed
  cancelled
}

enum StaffRole {
  front_desk
  housekeeping
  room_service
  maintenance
  manager
  admin
}

enum RoomStatus {
  clean
  occupied
  dirty
  inspected
  out_of_order
}

enum LoyaltyTransactionType {
  earn
  redeem
  expire
  adjust
  bonus
  referral
}

// ─── TABLES ───────────────────────────────────────────────

model Property {
  id                  String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name                String   @db.VarChar(200)
  slug                String   @unique @db.VarChar(100)
  address             String
  city                String   @db.VarChar(100)
  country             String   @db.Char(2)
  timezone            String   @default("Asia/Kolkata") @db.VarChar(50)
  pmsType             String?  @db.VarChar(50)
  pmsApiKeyEnc        String?
  waPhoneNumberId     String?  @db.VarChar(50)
  waAccessTokenEnc    String?
  loyaltyEarnRate     Decimal  @default(1.00) @db.Decimal(5, 2)
  pointsExpiryDays    Int      @default(365)
  subscriptionTier    String   @default("starter") @db.VarChar(20)
  isActive            Boolean  @default(true)
  createdAt           DateTime @default(now()) @db.Timestamptz
  updatedAt           DateTime @updatedAt @db.Timestamptz

  rooms        Room[]
  staff        Staff[]
  reservations Reservation[]
  guests       Guest[]
  menuItems    MenuItem[]
  campaigns    CrmCampaign[]

  @@map("properties")
}

model Guest {
  id               String       @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  phone            String       @unique @db.VarChar(20)
  email            String?      @unique @db.VarChar(255)
  fullName         String       @db.VarChar(200)
  nationality      String?      @db.Char(2)
  languageCode     String       @default("en") @db.VarChar(10)
  dateOfBirth      DateTime?    @db.Date
  anniversaryDate  DateTime?    @db.Date
  loyaltyTier      LoyaltyTier  @default(bronze)
  loyaltyPoints    Int          @default(0)
  lifetimePoints   Int          @default(0)
  totalStays       Int          @default(0)
  totalRevenue     Decimal      @default(0) @db.Decimal(12, 2)
  sentimentScore   Decimal      @default(0.50) @db.Decimal(3, 2)
  churnRisk        Decimal?     @db.Decimal(3, 2)
  dietaryFlags     String[]     @default([])
  waOptIn          Boolean      @default(false)
  appPushOptIn     Boolean      @default(false)
  profileMongoId   String?      @db.VarChar(24)
  propertyId       String       @db.Uuid
  createdAt        DateTime     @default(now()) @db.Timestamptz
  updatedAt        DateTime     @updatedAt @db.Timestamptz

  property             Property               @relation(fields: [propertyId], references: [id])
  reservations         Reservation[]
  loyaltyTransactions  LoyaltyTransaction[]
  feedback             GuestFeedback[]
  waConversations      WaConversation[]

  @@map("guests")
}

model Staff {
  id           String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  propertyId   String    @db.Uuid
  email        String    @unique @db.VarChar(255)
  fullName     String    @db.VarChar(200)
  role         StaffRole
  passwordHash String
  totpSecret   String?
  fcmToken     String?
  isActive     Boolean   @default(true)
  createdAt    DateTime  @default(now()) @db.Timestamptz
  updatedAt    DateTime  @updatedAt @db.Timestamptz

  property        Property        @relation(fields: [propertyId], references: [id])
  assignedOrders  Order[]
  waConversations WaConversation[]

  @@map("staff")
}

model Room {
  id                String     @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  propertyId        String     @db.Uuid
  roomNumber        String     @db.VarChar(10)
  roomType          String     @db.VarChar(50)
  floor             Int
  maxOccupancy      Int        @default(2)
  baseRate          Decimal    @db.Decimal(10, 2)
  iotControllerId   String?    @db.VarChar(100)
  lockDeviceId      String?    @db.VarChar(100)
  amenities         String[]   @default([])
  isAvailable       Boolean    @default(true)
  housekeepingStatus RoomStatus @default(clean)
  lastCleanedAt     DateTime?  @db.Timestamptz
  createdAt         DateTime   @default(now()) @db.Timestamptz

  property     Property      @relation(fields: [propertyId], references: [id])
  reservations Reservation[]

  @@unique([propertyId, roomNumber])
  @@map("rooms")
}

model Reservation {
  id                String            @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  guestId           String            @db.Uuid
  propertyId        String            @db.Uuid
  roomId            String?           @db.Uuid
  pmsBookingRef     String?           @unique @db.VarChar(50)
  status            ReservationStatus
  checkInDate       DateTime          @db.Date
  checkOutDate      DateTime          @db.Date
  actualCheckIn     DateTime?         @db.Timestamptz
  actualCheckOut    DateTime?         @db.Timestamptz
  adults            Int
  children          Int               @default(0)
  ratePlan          String?           @db.VarChar(20)
  roomRate          Decimal?          @db.Decimal(10, 2)
  totalRoomAmount   Decimal           @default(0) @db.Decimal(12, 2)
  totalFnbAmount    Decimal           @default(0) @db.Decimal(12, 2)
  totalOtherAmount  Decimal           @default(0) @db.Decimal(12, 2)
  totalAmount       Decimal           @default(0) @db.Decimal(12, 2)
  paidAmount        Decimal           @default(0) @db.Decimal(12, 2)
  source            String?           @db.VarChar(50)
  specialRequests   String?
  aiPreBrief        String?
  mobileKeyId       String?           @db.VarChar(100)
  isDnd             Boolean           @default(false)
  createdAt         DateTime          @default(now()) @db.Timestamptz
  updatedAt         DateTime          @updatedAt @db.Timestamptz

  guest    Guest    @relation(fields: [guestId], references: [id])
  property Property @relation(fields: [propertyId], references: [id])
  room     Room?    @relation(fields: [roomId], references: [id])
  orders   Order[]
  feedback GuestFeedback[]
  loyaltyTransactions LoyaltyTransaction[]

  @@map("reservations")
}

model MenuItem {
  id              String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  propertyId      String   @db.Uuid
  name            String   @db.VarChar(200)
  description     String?
  price           Decimal  @db.Decimal(10, 2)
  category        String   @db.VarChar(50)
  dietaryTags     String[] @default([])
  allergens       String[] @default([])
  imageUrl        String?
  prepTimeMinutes Int      @default(15)
  isAvailable     Boolean  @default(true)
  availableFrom   String?  @db.VarChar(5)
  availableTo     String?  @db.VarChar(5)
  sortOrder       Int      @default(0)
  createdAt       DateTime @default(now()) @db.Timestamptz

  property Property @relation(fields: [propertyId], references: [id])

  @@map("menu_items")
}

model Order {
  id               String      @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  reservationId    String      @db.Uuid
  guestId          String      @db.Uuid
  propertyId       String      @db.Uuid
  assignedStaffId  String?     @db.Uuid
  type             OrderType
  status           OrderStatus @default(pending)
  items            Json        @default("[]")
  totalAmount      Decimal     @default(0) @db.Decimal(10, 2)
  scheduledFor     DateTime?   @db.Timestamptz
  slaDeadline      DateTime?   @db.Timestamptz
  acceptedAt       DateTime?   @db.Timestamptz
  completedAt      DateTime?   @db.Timestamptz
  guestRating      Int?
  guestFeedback    String?
  source           String      @default("app") @db.VarChar(20)
  notes            String?
  createdAt        DateTime    @default(now()) @db.Timestamptz
  updatedAt        DateTime    @updatedAt @db.Timestamptz

  reservation  Reservation @relation(fields: [reservationId], references: [id])
  assignedStaff Staff?     @relation(fields: [assignedStaffId], references: [id])

  @@map("orders")
}

model LoyaltyTransaction {
  id            String                 @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  guestId       String                 @db.Uuid
  propertyId    String                 @db.Uuid
  reservationId String?                @db.Uuid
  type          LoyaltyTransactionType
  points        Int
  balanceAfter  Int
  reason        String?                @db.VarChar(200)
  referenceId   String?                @db.Uuid
  expiresAt     DateTime?              @db.Date
  isExpired     Boolean                @default(false)
  createdAt     DateTime               @default(now()) @db.Timestamptz

  guest       Guest        @relation(fields: [guestId], references: [id])
  reservation Reservation? @relation(fields: [reservationId], references: [id])

  @@map("loyalty_transactions")
}

model GuestFeedback {
  id            String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  reservationId String   @db.Uuid
  guestId       String   @db.Uuid
  orderId       String?  @db.Uuid
  rating        Int
  mood          String   @db.VarChar(20)
  categories    Json     @default("{}")
  textNote      String?
  voiceNoteUrl  String?
  isAnonymous   Boolean  @default(false)
  createdAt     DateTime @default(now()) @db.Timestamptz

  reservation Reservation @relation(fields: [reservationId], references: [id])
  guest       Guest       @relation(fields: [guestId], references: [id])

  @@map("guest_feedback")
}

model WaConversation {
  id               String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  guestId          String   @db.Uuid
  propertyId       String   @db.Uuid
  waContactId      String   @db.VarChar(20)
  status           String   @default("active") @db.VarChar(20)
  journeyStage     String?  @db.VarChar(30)
  botEnabled       Boolean  @default(true)
  lastMessageAt    DateTime? @db.Timestamptz
  sessionSentiment Decimal  @default(0.50) @db.Decimal(3, 2)
  complaintFlag    Boolean  @default(false)
  unreadCount      Int      @default(0)
  contextSnapshot  Json     @default("[]")
  assignedAgentId  String?  @db.Uuid
  reservationId    String?  @db.Uuid
  createdAt        DateTime @default(now()) @db.Timestamptz
  updatedAt        DateTime @updatedAt @db.Timestamptz

  guest         Guest  @relation(fields: [guestId], references: [id])
  assignedAgent Staff? @relation(fields: [assignedAgentId], references: [id])

  @@map("wa_conversations")
}

model CrmCampaign {
  id                 String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  propertyId         String   @db.Uuid
  name               String   @db.VarChar(200)
  triggerType        String   @db.VarChar(50)
  triggerDelayHours  Int      @default(0)
  targetSegment      Json     @default("{}")
  messageTemplate    String
  waTemplateName     String?  @db.VarChar(100)
  abVariant          String   @default("A") @db.Char(1)
  abSplitPct         Int      @default(50)
  sentCount          Int      @default(0)
  readCount          Int      @default(0)
  repliedCount       Int      @default(0)
  convertedCount     Int      @default(0)
  revenueAttributed  Decimal  @default(0) @db.Decimal(12, 2)
  isActive           Boolean  @default(true)
  createdAt          DateTime @default(now()) @db.Timestamptz

  property Property @relation(fields: [propertyId], references: [id])

  @@map("crm_campaigns")
}

model NotificationLog {
  id         String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  recipientId String  @db.Uuid
  type       String   @db.VarChar(30)
  channel    String   @db.VarChar(20)
  payload    Json
  sentAt     DateTime @default(now()) @db.Timestamptz
  status     String   @default("sent") @db.VarChar(20)

  @@map("notification_log")
}
\`\`\`

## STEP 3 — Run migration
\`\`\`bash
cd services/auth-service
pnpm exec prisma migrate dev --name initial_schema
\`\`\`

## STEP 4 — Generate Prisma client
\`\`\`bash
pnpm exec prisma generate
\`\`\`

## STEP 5 — Create scripts/seed.ts
Create a seed script that inserts:

1. One Property: { name: "The Grand Chennai", slug: "grand-chennai", city: "Chennai", country: "IN" }
2. 10 Rooms: floors 1–5, mix of "Deluxe King" and "Standard Twin", rates ₹5,000–₹12,000
3. 3 Staff members: one manager, one front_desk, one housekeeping
4. 20 MenuItem records: mix of breakfast, mains, desserts, beverages
5. 2 Guest records with realistic Indian names and phone numbers
6. 1 Reservation per guest (status: confirmed, future dates)

Use @faker-js/faker for realistic data generation.

## STEP 6 — Verify
Run \`pnpm exec prisma studio\` and confirm all tables exist with correct columns.

## Acceptance criteria
- \`pnpm exec prisma migrate deploy\` runs with zero errors
- All 14 tables created in PostgreSQL
- \`pnpm seed\` populates demo data successfully
- \`pnpm exec prisma studio\` shows all tables with correct columns and relationships`
},

// ─────────────────────────────────────────────────────────
{ num:'T-03', title:'auth-service — OTP login & JWT', phase:'Phase 1 · Wk 1', effort:'2 days', color:C.teal,
  objective:'Build the complete authentication microservice handling guest OTP login, staff password+TOTP login, JWT RS256 token issuance and refresh, and session management in Redis.',
  dependencies:'T-01, T-02',
  outputs:['services/auth-service/src/ — complete Fastify service','POST /api/v1/auth/otp/send — sends OTP via Firebase Auth','POST /api/v1/auth/otp/verify — verifies OTP, returns token pair','POST /api/v1/auth/staff/login — email+password+TOTP','POST /api/v1/auth/refresh — refresh token rotation','POST /api/v1/auth/logout — invalidates session','GET /api/v1/auth/me — current user from JWT','Middleware: verifyJwt (all services can import)','Unit tests for all auth flows'],
  prompt:`Build the complete auth-service for Hotel OS. This service handles ALL authentication.

## Dependencies to install
\`\`\`bash
cd services/auth-service
pnpm add fastify @fastify/cors @fastify/jwt @fastify/helmet @fastify/rate-limit
pnpm add ioredis bullmq firebase-admin speakeasy bcryptjs zod pino
pnpm add @hotel-os/types
pnpm add -D vitest supertest @types/node tsx
\`\`\`

## Architecture decisions
- JWT algorithm: RS256 (asymmetric). Private key signs, public key verifies.
- Access token TTL: 15 minutes (900 seconds)
- Refresh token TTL: 30 days (2592000 seconds). Stored in Redis as: refresh:{token_jti} → {userId, userType, role}
- OTP: 6-digit numeric code. TTL: 5 minutes. Max 3 attempts. Stored in Redis as: otp:{phone} → {code, attempts}
- Rate limiting: OTP send: 3 per 15 minutes per IP. Login: 10 per minute per IP.

## STEP 1 — src/config.ts
\`\`\`typescript
import { z } from 'zod';

const ConfigSchema = z.object({
  PORT: z.string().default('3001'),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string(),
  JWT_PRIVATE_KEY: z.string(),
  JWT_PUBLIC_KEY: z.string(),
  JWT_ACCESS_TTL: z.coerce.number().default(900),
  JWT_REFRESH_TTL: z.coerce.number().default(2592000),
  FIREBASE_SERVICE_ACCOUNT: z.string(),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

export const config = ConfigSchema.parse(process.env);
\`\`\`

## STEP 2 — src/lib/redis.ts
\`\`\`typescript
import Redis from 'ioredis';
import { config } from '../config.js';

export const redis = new Redis(config.REDIS_URL, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

export const OTP_PREFIX = 'otp:';
export const REFRESH_PREFIX = 'refresh:';
export const RATE_OTP_PREFIX = 'rate:otp:';

export async function storeOtp(phone: string, code: string): Promise<void> {
  const key = OTP_PREFIX + phone;
  await redis.setex(key, 300, JSON.stringify({ code, attempts: 0 }));
}

export async function verifyOtp(phone: string, inputCode: string): Promise<{ valid: boolean; locked: boolean }> {
  const key = OTP_PREFIX + phone;
  const raw = await redis.get(key);
  if (!raw) return { valid: false, locked: false };
  
  const data = JSON.parse(raw) as { code: string; attempts: number };
  if (data.attempts >= 3) return { valid: false, locked: true };
  
  if (data.code !== inputCode) {
    await redis.setex(key, 300, JSON.stringify({ ...data, attempts: data.attempts + 1 }));
    return { valid: false, locked: false };
  }
  
  await redis.del(key);
  return { valid: true, locked: false };
}

export async function storeRefreshToken(jti: string, payload: object, ttl: number): Promise<void> {
  await redis.setex(REFRESH_PREFIX + jti, ttl, JSON.stringify(payload));
}

export async function getRefreshToken(jti: string): Promise<object | null> {
  const raw = await redis.get(REFRESH_PREFIX + jti);
  return raw ? JSON.parse(raw) : null;
}

export async function deleteRefreshToken(jti: string): Promise<void> {
  await redis.del(REFRESH_PREFIX + jti);
}
\`\`\`

## STEP 3 — src/lib/firebase.ts
\`\`\`typescript
import * as admin from 'firebase-admin';
import { config } from '../config.js';

let firebaseApp: admin.app.App;

export function getFirebaseApp(): admin.app.App {
  if (!firebaseApp) {
    const serviceAccount = JSON.parse(config.FIREBASE_SERVICE_ACCOUNT);
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
  return firebaseApp;
}

export async function sendOtpSms(phone: string, otp: string): Promise<void> {
  // In development, log OTP. In production, use Firebase Auth or SMS provider.
  if (config.NODE_ENV === 'development') {
    console.log(\`[DEV] OTP for \${phone}: \${otp}\`);
    return;
  }
  // Production: integrate with Firebase Auth custom OTP or Twilio
  // Implementation depends on chosen SMS provider
}

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
\`\`\`

## STEP 4 — src/lib/jwt.ts
\`\`\`typescript
import { SignJWT, jwtVerify, JWTPayload } from 'jose';
import { randomUUID } from 'crypto';
import { config } from '../config.js';

const privateKey = async () => {
  const { createPrivateKey } = await import('crypto');
  return createPrivateKey(config.JWT_PRIVATE_KEY);
};

const publicKey = async () => {
  const { createPublicKey } = await import('crypto');
  return createPublicKey(config.JWT_PUBLIC_KEY);
};

export interface TokenPayload extends JWTPayload {
  userId: string;
  userType: 'guest' | 'staff';
  role?: string;
  propertyId?: string;
}

export async function signAccessToken(payload: Omit<TokenPayload, 'iat' | 'exp' | 'jti'>): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuedAt()
    .setExpirationTime(\`\${config.JWT_ACCESS_TTL}s\`)
    .setJti(randomUUID())
    .sign(await privateKey());
}

export async function signRefreshToken(payload: Omit<TokenPayload, 'iat' | 'exp' | 'jti'>): Promise<{ token: string; jti: string }> {
  const jti = randomUUID();
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuedAt()
    .setExpirationTime(\`\${config.JWT_REFRESH_TTL}s\`)
    .setJti(jti)
    .sign(await privateKey());
  return { token, jti };
}

export async function verifyToken(token: string): Promise<TokenPayload> {
  const { payload } = await jwtVerify(token, await publicKey(), {
    algorithms: ['RS256'],
  });
  return payload as TokenPayload;
}
\`\`\`

## STEP 5 — src/routes/auth.routes.ts
Create complete route handlers for all 6 auth endpoints.

### POST /api/v1/auth/otp/send
Input validation:
\`\`\`typescript
const SendOtpSchema = z.object({
  phone: z.string().regex(/^\\+[1-9]\\d{1,14}$/, 'Phone must be E.164 format'),
});
\`\`\`

Logic:
1. Validate input with Zod
2. Check rate limit: if otp:rate:{phone} exists and count >= 3, return 429 with retry_after
3. Generate 6-digit OTP
4. Store in Redis: otp:{phone} → { code, attempts: 0 } with 300s TTL
5. Increment rate counter: otp:rate:{phone} with 900s TTL
6. Send OTP via Firebase (log in dev)
7. Return { success: true, expires_in: 300 }

### POST /api/v1/auth/otp/verify
Input validation:
\`\`\`typescript
const VerifyOtpSchema = z.object({
  phone: z.string().regex(/^\\+[1-9]\\d{1,14}$/),
  otp: z.string().length(6).regex(/^\\d{6}$/),
});
\`\`\`

Logic:
1. Validate input
2. Call verifyOtp(phone, otp) from redis lib
3. If locked: return 429 { error: { code: 'OTP_MAX_ATTEMPTS', message: 'Account locked for 15 minutes' } }
4. If not valid: return 401 { error: { code: 'OTP_INVALID', message: 'Invalid or expired OTP' } }
5. Upsert guest in database (findFirst by phone, or create new)
6. Sign access token and refresh token
7. Store refresh token JTI in Redis
8. Return full response:
\`\`\`json
{
  "access_token": "...",
  "refresh_token": "...",
  "guest": {
    "id": "uuid",
    "phone": "+919876543210",
    "full_name": "Priya Mehta",
    "loyalty_tier": "bronze",
    "loyalty_points": 0,
    "is_new": true
  }
}
\`\`\`

### POST /api/v1/auth/staff/login
\`\`\`typescript
const StaffLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  totp_code: z.string().length(6).optional(),
});
\`\`\`

Logic:
1. Find staff by email
2. Compare password with bcrypt
3. If staff has totpSecret, verify TOTP code with speakeasy
4. Sign tokens with userType: 'staff', role: staff.role
5. Return same token pair shape

### POST /api/v1/auth/refresh
\`\`\`typescript
const RefreshSchema = z.object({
  refresh_token: z.string(),
});
\`\`\`

Logic:
1. Verify JWT signature
2. Extract JTI, look up in Redis
3. If not found: return 401 (token revoked or expired)
4. Delete old refresh token from Redis (rotation)
5. Issue new access token + new refresh token
6. Store new refresh token in Redis
7. Return new token pair

### POST /api/v1/auth/logout
Requires valid access token (JWT middleware).
Logic: Delete refresh token from Redis. Return { success: true }.

### GET /api/v1/auth/me
Requires valid access token.
Logic: Fetch guest or staff record from DB by userId in JWT. Return profile.

## STEP 6 — src/middleware/auth.middleware.ts
Export a Fastify preHandler that validates JWT and attaches user to request:
\`\`\`typescript
export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  const header = request.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return reply.status(401).send({ error: { code: 'AUTH_REQUIRED', message: 'Authorization header missing' } });
  }
  try {
    const token = header.slice(7);
    const payload = await verifyToken(token);
    request.user = payload;
  } catch {
    return reply.status(401).send({ error: { code: 'TOKEN_INVALID', message: 'Invalid or expired token' } });
  }
}

export async function requireRole(...roles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    await requireAuth(request, reply);
    if (!roles.includes(request.user?.role ?? '')) {
      return reply.status(403).send({ error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } });
    }
  };
}
\`\`\`

## STEP 7 — src/index.ts — Fastify app setup
\`\`\`typescript
import Fastify from 'fastify';
import { authRoutes } from './routes/auth.routes.js';

const app = Fastify({ logger: { level: 'info' } });

app.register(import('@fastify/cors'), { origin: true });
app.register(import('@fastify/helmet'));
app.register(import('@fastify/rate-limit'), { max: 100, timeWindow: '1 minute' });

app.get('/health', async () => ({ status: 'ok', service: 'auth-service' }));
app.register(authRoutes, { prefix: '/api/v1/auth' });

app.listen({ port: Number(process.env.PORT || 3001), host: '0.0.0.0' });
\`\`\`

## STEP 8 — Unit tests (src/__tests__/auth.test.ts)
Write tests for:
- OTP generation produces 6-digit string
- Redis storeOtp + verifyOtp happy path
- Redis verifyOtp returns locked after 3 attempts
- JWT signAccessToken + verifyToken round-trip
- Refresh token rotation (old token deleted, new one issued)

## Acceptance criteria
- All 6 endpoints return correct HTTP status codes
- Invalid OTP returns 401, not 500
- After 3 failed OTPs, account locked and returns 429
- Expired access token returns 401 on /auth/me
- Refresh token rotation works: old refresh rejected after use, new one accepted
- All unit tests pass`
},

// ─────────────────────────────────────────────────────────
{ num:'T-04', title:'booking-service — reservations & PMS sync', phase:'Phase 1 · Wk 2', effort:'2 days', color:C.teal,
  objective:'Build the booking-service that manages the full reservation lifecycle, syncs with Cloudbeds PMS via webhooks, and emits BullMQ events on every status change for downstream services to react to.',
  dependencies:'T-01, T-02, T-03',
  outputs:['GET /api/v1/reservations/active','GET /api/v1/reservations/:id','POST /api/v1/reservations/:id/pre-checkin','POST /api/v1/reservations/:id/checkin','POST /api/v1/reservations/:id/checkout','GET /api/v1/reservations/:id/folio','POST /webhooks/cloudbeds — Cloudbeds webhook receiver','BullMQ event emitters: booking.confirmed, booking.pre_checked_in, booking.checked_in, booking.checked_out'],
  prompt:`Build the complete booking-service for Hotel OS. This service manages reservations and syncs with the PMS.

## Dependencies to install
\`\`\`bash
cd services/booking-service
pnpm add fastify @fastify/cors @fastify/jwt @fastify/helmet
pnpm add @prisma/client bullmq ioredis zod pino axios crypto
pnpm add @hotel-os/types
pnpm add -D vitest @types/node tsx
\`\`\`

## STEP 1 — BullMQ queue setup (src/lib/queue.ts)
\`\`\`typescript
import { Queue } from 'bullmq';
import { config } from '../config.js';

const connection = { url: config.REDIS_URL };

export const bookingEventsQueue = new Queue('booking-events', { connection });

export type BookingEvent =
  | { type: 'booking.confirmed'; reservationId: string; guestId: string; propertyId: string }
  | { type: 'booking.pre_checked_in'; reservationId: string; guestId: string }
  | { type: 'booking.checked_in'; reservationId: string; guestId: string; roomId: string; mobileKeyNeeded: boolean }
  | { type: 'booking.checked_out'; reservationId: string; guestId: string; totalAmount: number };

export async function emitBookingEvent(event: BookingEvent): Promise<void> {
  await bookingEventsQueue.add(event.type, event, {
    removeOnComplete: 100,
    removeOnFail: 50,
  });
}
\`\`\`

## STEP 2 — src/routes/reservation.routes.ts

### GET /api/v1/reservations/active
- Requires auth (guest JWT)
- Find reservation WHERE guestId = request.user.userId AND status IN (confirmed, pre_checked_in, checked_in) AND checkOutDate >= today
- Include room data
- Calculate balanceDue = totalAmount - paidAmount
- Include mobileKeyStatus from mobileKeyId field

Response shape:
\`\`\`typescript
{
  id: string;
  pmsBookingRef: string | null;
  status: string;
  room: {
    id: string;
    roomNumber: string;
    roomType: string;
    floor: number;
    amenities: string[];
  } | null;
  checkInDate: string;       // YYYY-MM-DD
  checkOutDate: string;
  adults: number;
  children: number;
  ratePlan: string | null;
  roomRate: number;
  totalRoomAmount: number;
  totalFnbAmount: number;
  totalOtherAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  mobileKeyStatus: 'not_applicable' | 'pending_activation' | 'active' | 'revoked';
  isDnd: boolean;
  specialRequests: string | null;
}
\`\`\`

### POST /api/v1/reservations/:id/pre-checkin
Input schema:
\`\`\`typescript
const PreCheckinSchema = z.object({
  id_scan: z.object({
    document_type: z.enum(['passport', 'aadhaar', 'dl']),
    full_name: z.string().min(1),
    date_of_birth: z.string().regex(/^\\d{4}-\\d{2}-\\d{2}$/),
    document_number_hash: z.string(),
  }),
  preferences: z.object({
    room_temp_celsius: z.number().min(16).max(30).optional(),
    pillow_type: z.enum(['soft', 'firm', 'medium']).optional(),
    floor_preference: z.enum(['high', 'low', 'none']).optional(),
    early_checkin_request: z.boolean().default(false),
    special_notes: z.string().max(500).optional(),
  }),
  eta: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
});
\`\`\`

Logic:
1. Validate guest owns this reservation
2. Update reservation status to pre_checked_in
3. Save preferences to guest record (via Prisma upsert)
4. Emit booking.pre_checked_in event via BullMQ
5. Return { success: true, checkin_confirmed: true, mobile_key_status: 'pending_activation', room_assigned: {...} }

### POST /api/v1/reservations/:id/checkout
Input schema:
\`\`\`typescript
const CheckoutSchema = z.object({
  payment_method: z.enum(['razorpay', 'stripe', 'loyalty_points', 'folio']),
  razorpay_payment_id: z.string().optional(),
  tip_amount: z.number().min(0).default(0),
});
\`\`\`

Logic:
1. Verify payment if method requires it
2. Set actualCheckOut timestamp
3. Update status to checked_out
4. Calculate loyalty points earned (totalAmount / 100 * propertyLoyaltyEarnRate)
5. Emit booking.checked_out event (access-service will revoke key, loyalty-service will credit points)
6. Return receipt with invoice_url placeholder

### GET /api/v1/reservations/:id/folio
Return itemised bill:
\`\`\`typescript
{
  reservation_id: string;
  guest_name: string;
  room_number: string;
  check_in: string;
  check_out: string;
  line_items: Array<{
    id: string;
    description: string;
    type: 'room' | 'food' | 'laundry' | 'amenity' | 'other';
    amount: number;
    date: string;
    order_id?: string;
  }>;
  subtotals: {
    room: number;
    fnb: number;
    other: number;
  };
  total_amount: number;
  paid_amount: number;
  balance_due: number;
}
\`\`\`

Room charges calculated as: roomRate * number of nights.
Other line items from orders table WHERE reservationId = :id AND status = 'completed'.

## STEP 3 — src/routes/webhook.routes.ts (Cloudbeds)

### POST /webhooks/cloudbeds
\`\`\`typescript
// Cloudbeds sends webhook events for booking lifecycle changes
// Verify signature: HMAC-SHA256 of raw body with CLOUDBEDS_WEBHOOK_SECRET

const CloudbedsWebhookSchema = z.object({
  event: z.string(),
  data: z.object({
    reservationID: z.string(),
    guestID: z.string().optional(),
    status: z.string().optional(),
    checkIn: z.string().optional(),
    checkOut: z.string().optional(),
    roomID: z.string().optional(),
  }),
});
\`\`\`

Event mapping:
- new_reservation → create/upsert reservation with status: confirmed, emit booking.confirmed
- modification → update reservation fields
- cancellation → set status: cancelled
- check_in → set status: checked_in, set actualCheckIn, emit booking.checked_in
- check_out → set status: checked_out, set actualCheckOut, emit booking.checked_out

For each event: upsert reservation by pmsBookingRef. If guest doesn't exist, create a placeholder guest record.

## STEP 4 — Manual reservation creation (for direct bookings)
### POST /api/v1/reservations (staff only — front_desk or manager role)
Allow staff to create reservations directly for walk-ins or phone bookings.

## STEP 5 — BullMQ worker for PMS reconciliation (src/workers/pms-sync.worker.ts)
Create a repeatable job that runs every 5 minutes:
- Fetch reservations arriving today and tomorrow from Cloudbeds API
- Upsert any that are missing or out of sync
- Log sync results

## Acceptance criteria
- GET /active returns null gracefully when guest has no reservation
- Pre-checkin updates preferences on guest record
- Checkout emits booking.checked_out event to BullMQ
- Cloudbeds webhook creates reservation and emits correct event
- Folio correctly sums room charges + completed orders`
},

// ─────────────────────────────────────────────────────────
{ num:'T-05', title:'orders-service — F&B, laundry & task engine', phase:'Phase 1 · Wk 2', effort:'3 days', color:C.teal,
  objective:'Build the orders-service with a full state machine for food orders, laundry requests, and housekeeping tasks. Includes real-time Socket.io status updates, SLA enforcement via BullMQ, and staff assignment.',
  dependencies:'T-01, T-02, T-03',
  outputs:['GET /api/v1/menu','POST /api/v1/orders','GET /api/v1/orders/:id','PATCH /api/v1/orders/:id/status (staff)','PATCH /api/v1/orders/:id/rate','GET /api/v1/orders/active','POST /api/v1/housekeeping/schedule','PATCH /api/v1/housekeeping/dnd','Socket.io server broadcasting order:status_update events','SLA enforcement jobs via BullMQ (escalation on breach)'],
  prompt:`Build the complete orders-service for Hotel OS. This handles all in-stay service requests.

## Dependencies
\`\`\`bash
cd services/orders-service
pnpm add fastify @fastify/cors @fastify/jwt @fastify/helmet socket.io
pnpm add @prisma/client bullmq ioredis zod pino
pnpm add @hotel-os/types
\`\`\`

## STEP 1 — SLA configuration (src/lib/sla.ts)
\`\`\`typescript
export const SLA_MINUTES: Record<string, number> = {
  food: 30,
  beverage: 25,
  laundry_pickup: 15,
  laundry_delivery: 240,
  housekeeping: 30,
  amenity: 20,
  maintenance: 120,
  spa: 15,
};

export function calculateSlaDeadline(orderType: string, acceptedAt: Date): Date {
  const minutes = SLA_MINUTES[orderType] ?? 30;
  return new Date(acceptedAt.getTime() + minutes * 60 * 1000);
}

export function getSlaStatus(slaDeadline: Date | null): 'ok' | 'warning' | 'breached' {
  if (!slaDeadline) return 'ok';
  const now = new Date();
  const minutesRemaining = (slaDeadline.getTime() - now.getTime()) / 60000;
  if (minutesRemaining < 0) return 'breached';
  if (minutesRemaining < 10) return 'warning';
  return 'ok';
}
\`\`\`

## STEP 2 — Socket.io setup (src/lib/socket.ts)
\`\`\`typescript
import { Server } from 'socket.io';
import { verifyToken } from './jwt.js';

export function createSocketServer(httpServer: any): Server {
  const io = new Server(httpServer, {
    cors: { origin: '*' },
    transports: ['websocket', 'polling'],
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token as string;
      const payload = await verifyToken(token);
      socket.data.user = payload;
      next();
    } catch {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.data.user;
    
    // Guests join their reservation room
    if (user.userType === 'guest' && user.reservationId) {
      socket.join(\`reservation:\${user.reservationId}\`);
    }
    
    // Staff join the property room
    if (user.userType === 'staff') {
      socket.join(\`property:\${user.propertyId}\`);
    }
  });

  return io;
}

export function emitOrderUpdate(io: Server, reservationId: string, data: object) {
  io.to(\`reservation:\${reservationId}\`).emit('order:status_update', data);
}

export function emitNewTask(io: Server, propertyId: string, data: object) {
  io.to(\`property:\${propertyId}\`).emit('task:new', data);
}

export function emitSlaWarning(io: Server, propertyId: string, data: object) {
  io.to(\`property:\${propertyId}\`).emit('task:sla_warning', data);
}
\`\`\`

## STEP 3 — Menu endpoints (src/routes/menu.routes.ts)

### GET /api/v1/menu
Query params: category?, dietary?, search?, recommended?

Logic:
1. Fetch menu items WHERE propertyId = guest's property AND isAvailable = true
2. If category provided, filter by category
3. If dietary provided, filter where dietaryTags @> [dietary]
4. If search provided, case-insensitive name/description search
5. Check kitchen hours — if outside hours, add \`kitchen_open: false\` to response
6. If recommended=true and guest profile has dietary flags, put matching items first

Response:
\`\`\`typescript
{
  items: MenuItem[];
  categories: string[];
  recommended: MenuItem[];      // up to 3, based on dietary profile
  kitchen_open: boolean;
  kitchen_hours: { open: string; close: string };
}
\`\`\`

## STEP 4 — Order creation (src/routes/order.routes.ts)

### POST /api/v1/orders
Input schema:
\`\`\`typescript
const CreateOrderSchema = z.object({
  reservation_id: z.string().uuid(),
  type: z.enum(['food', 'beverage', 'laundry', 'housekeeping', 'amenity', 'maintenance']),
  items: z.array(z.object({
    menu_item_id: z.string().uuid().optional(),
    name: z.string().min(1),
    quantity: z.number().int().min(1),
    unit_price: z.number().min(0),
    notes: z.string().max(500).optional(),
  })),
  scheduled_for: z.string().datetime().optional().nullable(),
  payment_method: z.enum(['folio', 'razorpay', 'loyalty_points']).default('folio'),
  notes: z.string().max(1000).optional(),
});
\`\`\`

Logic:
1. Validate guest owns the reservation and it is in status checked_in
2. Calculate total_amount from items
3. Create order record with status: pending
4. Create SLA warning BullMQ job (delayed by SLA minutes - 10 minutes): emit sla_warning event
5. Create SLA breach BullMQ job (delayed by SLA minutes): mark order as potentially breached
6. Find available staff member for this order type (round-robin or least loaded)
7. Assign staff to order
8. Emit task:new via Socket.io to property room
9. Send FCM push to assigned staff
10. Return order with estimated_delivery_minutes

### GET /api/v1/orders/:id
Return full order with status_history (reconstructed from order fields), items, assigned_staff name.

### PATCH /api/v1/orders/:id/status (staff JWT required)
Input: { status: 'accepted' | 'in_progress' | 'completed' | 'cancelled', notes?: string, completion_photo_url?: string }

State machine enforcement:
- pending → accepted (allowed)
- accepted → in_progress (allowed)
- in_progress → completed (allowed, requires photo for housekeeping type)
- Any → cancelled (allowed for staff)
- No backwards transitions

On status change:
1. Update order in DB with timestamp fields
2. If accepted: set acceptedAt, calculate slaDeadline via calculateSlaDeadline()
3. Emit order:status_update via Socket.io to reservation room
4. If completed: update reservation totalFnbAmount/totalOtherAmount, queue loyalty earn job

### PATCH /api/v1/orders/:id/rate (guest JWT)
Input: { rating: 1–5, feedback?: string }
Update guestRating and guestFeedback on order.

### GET /api/v1/orders/active (guest JWT)
Return all orders for active reservation WHERE status NOT IN (completed, cancelled).

## STEP 5 — Housekeeping endpoints

### POST /api/v1/housekeeping/schedule
\`\`\`typescript
const ScheduleHousekeepingSchema = z.object({
  reservation_id: z.string().uuid(),
  date: z.string().regex(/^\\d{4}-\\d{2}-\\d{2}$/),
  time_slot: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  dnd_until: z.string().datetime().optional(),
  special_instructions: z.string().max(500).optional(),
});
\`\`\`

Creates an order of type: housekeeping with scheduledFor set to the requested time.

### PATCH /api/v1/housekeeping/dnd
\`\`\`typescript
const DndSchema = z.object({
  reservation_id: z.string().uuid(),
  enabled: z.boolean(),
  until: z.string().datetime().optional(),
});
\`\`\`

Updates reservation.isDnd field. Emits Socket.io event to staff so floor map updates.

## STEP 6 — SLA workers (src/workers/sla.worker.ts)
BullMQ worker that processes:
- sla_warning jobs: emit task:sla_warning to property room via Socket.io
- sla_breach jobs: send FCM push to property manager, mark order with breached flag

## Acceptance criteria
- Guest places food order → staff receives Socket.io task:new event within 1 second
- Staff accepts → Socket.io order:status_update fires immediately to guest
- Order marked completed → folio amount updated on reservation
- SLA warning fires 10 minutes before deadline
- DND toggle prevents housekeeping from appearing on floor map room
- Menu returns only items matching dietary filters`
},

// ─────────────────────────────────────────────────────────
{ num:'T-06', title:'access-service — mobile room key', phase:'Phase 1 · Wk 3', effort:'2 days', color:C.purple,
  objective:'Build the access-service that provisions, activates, and revokes digital BLE room keys by integrating with ASSA ABLOY Cloud API. Key provisioning is triggered by the booking.checked_in BullMQ event.',
  dependencies:'T-01, T-02, T-03, T-04',
  outputs:['GET /api/v1/reservations/:id/key','POST /api/v1/keys/provision (internal)','POST /api/v1/keys/revoke (internal)','BullMQ worker listening to booking-events queue: booking.checked_in → provision key, booking.checked_out → revoke key','Key audit log (all provision/revoke events stored)'],
  prompt:`Build the access-service for Hotel OS. This manages mobile room keys via ASSA ABLOY or Salto API.

## IMPORTANT — Hardware API note
For development/testing, implement a MOCK key provider that simulates ASSA ABLOY responses. The real ASSA ABLOY integration requires physical hardware and credentials. Structure the code with a provider interface so the real API can be swapped in later.

## Dependencies
\`\`\`bash
cd services/access-service
pnpm add fastify @fastify/cors @fastify/jwt @fastify/helmet
pnpm add @prisma/client bullmq ioredis zod pino axios crypto
\`\`\`

## STEP 1 — Key provider interface (src/providers/key-provider.interface.ts)
\`\`\`typescript
export interface KeyProvisionResult {
  keyToken: string;       // The BLE credential token
  lockDeviceId: string;   // Lock device to use this key on
  validFrom: Date;
  validUntil: Date;
  providerKeyId: string;  // External key ID for revocation
}

export interface IKeyProvider {
  provisionKey(params: {
    reservationId: string;
    roomNumber: string;
    lockDeviceId: string;
    validFrom: Date;
    validUntil: Date;
    guestName: string;
  }): Promise<KeyProvisionResult>;
  
  revokeKey(providerKeyId: string): Promise<void>;
}
\`\`\`

## STEP 2 — Mock provider (src/providers/mock.provider.ts)
\`\`\`typescript
import { randomBytes } from 'crypto';
import { IKeyProvider, KeyProvisionResult } from './key-provider.interface.js';

export class MockKeyProvider implements IKeyProvider {
  async provisionKey(params): Promise<KeyProvisionResult> {
    // Simulate 200ms API latency
    await new Promise(r => setTimeout(r, 200));
    
    return {
      keyToken: \`MOCK_BLE_\${randomBytes(16).toString('hex').toUpperCase()}\`,
      lockDeviceId: params.lockDeviceId || \`MOCK_LOCK_\${params.roomNumber}\`,
      validFrom: params.validFrom,
      validUntil: params.validUntil,
      providerKeyId: \`mock-key-\${randomBytes(8).toString('hex')}\`,
    };
  }

  async revokeKey(providerKeyId: string): Promise<void> {
    await new Promise(r => setTimeout(r, 100));
    console.log(\`[Mock] Revoked key: \${providerKeyId}\`);
  }
}
\`\`\`

## STEP 3 — ASSA ABLOY provider stub (src/providers/assa-abloy.provider.ts)
\`\`\`typescript
import axios from 'axios';
import { IKeyProvider, KeyProvisionResult } from './key-provider.interface.js';

export class AssaAbloyProvider implements IKeyProvider {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  async provisionKey(params): Promise<KeyProvisionResult> {
    // ASSA ABLOY Visionline Cloud Key API
    // POST /openings/{lockId}/credentials
    const response = await axios.post(
      \`\${this.baseUrl}/openings/\${params.lockDeviceId}/credentials\`,
      {
        startValidity: params.validFrom.toISOString(),
        endValidity: params.validUntil.toISOString(),
        label: \`\${params.guestName} - Room \${params.roomNumber}\`,
      },
      { headers: { Authorization: \`Bearer \${this.apiKey}\` } }
    );

    return {
      keyToken: response.data.mobileKey,
      lockDeviceId: params.lockDeviceId,
      validFrom: params.validFrom,
      validUntil: params.validUntil,
      providerKeyId: response.data.credentialId,
    };
  }

  async revokeKey(providerKeyId: string): Promise<void> {
    await axios.delete(\`\${this.baseUrl}/credentials/\${providerKeyId}\`, {
      headers: { Authorization: \`Bearer \${this.apiKey}\` }
    });
  }
}
\`\`\`

## STEP 4 — Key service (src/services/key.service.ts)
\`\`\`typescript
export class KeyService {
  constructor(private provider: IKeyProvider, private prisma: PrismaClient) {}

  async provisionKeyForReservation(reservationId: string): Promise<void> {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { room: true, guest: true },
    });

    if (!reservation?.room) throw new Error('Reservation has no room assigned');

    const validFrom = new Date(reservation.checkInDate);
    const validUntil = new Date(reservation.checkOutDate);
    validUntil.setHours(12, 0, 0, 0); // Keys expire at 12:00 on checkout day

    const result = await this.provider.provisionKey({
      reservationId,
      roomNumber: reservation.room.roomNumber,
      lockDeviceId: reservation.room.lockDeviceId ?? reservation.room.roomNumber,
      validFrom,
      validUntil,
      guestName: reservation.guest.fullName,
    });

    // Store key token on reservation
    await this.prisma.reservation.update({
      where: { id: reservationId },
      data: { mobileKeyId: result.providerKeyId },
    });

    // Store full key details in Redis for fast retrieval by guest app
    await redis.setex(
      \`key:\${reservationId}\`,
      Math.floor((validUntil.getTime() - Date.now()) / 1000),
      JSON.stringify({
        status: 'active',
        keyToken: result.keyToken,
        roomNumber: reservation.room.roomNumber,
        lockDeviceId: result.lockDeviceId,
        lockType: 'assa_abloy',
        validFrom: validFrom.toISOString(),
        validUntil: validUntil.toISOString(),
      })
    );

    // Audit log
    await this.logKeyEvent(reservationId, 'provisioned', result.providerKeyId);
  }

  async revokeKey(reservationId: string): Promise<void> {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
    });

    if (reservation?.mobileKeyId) {
      await this.provider.revokeKey(reservation.mobileKeyId);
      await this.prisma.reservation.update({
        where: { id: reservationId },
        data: { mobileKeyId: null },
      });
      await redis.del(\`key:\${reservationId}\`);
      await this.logKeyEvent(reservationId, 'revoked', reservation.mobileKeyId);
    }
  }

  private async logKeyEvent(reservationId: string, action: string, keyId: string) {
    await this.prisma.notificationLog.create({
      data: {
        recipientId: reservationId,
        type: 'key_event',
        channel: 'ble',
        payload: { action, keyId, timestamp: new Date().toISOString() },
        status: 'sent',
      },
    });
  }
}
\`\`\`

## STEP 5 — REST endpoints (src/routes/key.routes.ts)

### GET /api/v1/reservations/:id/key (guest JWT)
Logic:
1. Verify guest owns this reservation
2. Check Redis for key: key:{reservationId}
3. If found: return the full key object
4. If not found and reservation status is checked_in: provision new key (recovery flow)
5. If reservation not yet checked in: return pending_activation response
6. If checked out: return revoked response

Response shapes:
\`\`\`typescript
// Active key:
{
  status: 'active',
  key_token: string,       // BLE credential for react-native-ble-plx
  room_number: string,
  lock_device_id: string,
  lock_type: 'assa_abloy' | 'salto' | 'mock',
  valid_from: string,
  valid_until: string,
}

// Not yet active:
{
  status: 'pending_activation',
  activates_at: string,
  message: "Your key will activate on your check-in date"
}

// Revoked:
{
  status: 'revoked',
  message: "Your stay has ended. Thank you for staying with us!"
}
\`\`\`

### POST /api/v1/keys/revoke/:reservationId (internal — manager only)
Force-revoke a key. Used when guest reports lost phone.

## STEP 6 — BullMQ worker (src/workers/booking-events.worker.ts)
Listen to the booking-events queue from booking-service:

\`\`\`typescript
import { Worker } from 'bullmq';

const worker = new Worker('booking-events', async (job) => {
  switch (job.name) {
    case 'booking.checked_in':
      await keyService.provisionKeyForReservation(job.data.reservationId);
      break;
    case 'booking.checked_out':
      await keyService.revokeKey(job.data.reservationId);
      break;
  }
}, { connection: { url: config.REDIS_URL } });

worker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err }, 'Key provisioning job failed');
});
\`\`\`

## STEP 7 — Unit tests
Test:
- MockKeyProvider.provisionKey returns a valid token
- KeyService.provisionKeyForReservation stores key in Redis
- KeyService.revokeKey deletes key from Redis
- BullMQ worker calls provisionKey on booking.checked_in event

## Acceptance criteria
- booking.checked_in event → key provisioned within 2 seconds → retrievable via GET /key
- booking.checked_out event → key revoked → GET /key returns status: revoked
- Manager can force-revoke key via POST /keys/revoke/:id
- Key retrieval from Redis < 10ms (no DB query needed after provisioning)
- Failed provisioning is retried up to 3 times with exponential backoff`
},

// ─────────────────────────────────────────────────────────
{ num:'T-07', title:'ai-service — RAG concierge & intent classifier', phase:'Phase 1 · Wk 3', effort:'3 days', color:C.amber,
  objective:'Build the Python AI service with FastAPI. Implements the full RAG pipeline for the concierge (Pinecone vector store + Claude LLM), intent classification, hotel knowledge base ingestion, and the guest brief generation endpoint.',
  dependencies:'T-01, T-02, T-03',
  outputs:['apps/ai-service/ — complete FastAPI app','POST /classify — intent classification','POST /respond — RAG-augmented concierge response with action extraction','POST /embed — ingest hotel knowledge base documents','POST /guest-brief — AI guest summary for staff','Pinecone index setup script','Knowledge base ingestion script for menu + policy documents'],
  prompt:`Build the AI service for Hotel OS using Python 3.12, FastAPI, LangChain, and the Anthropic Claude API.

## Setup
\`\`\`bash
cd apps/ai-service
python3 -m venv .venv
source .venv/bin/activate
pip install fastapi uvicorn[standard] anthropic openai langchain langchain-anthropic langchain-openai pinecone-client pydantic python-dotenv redis httpx pytest
\`\`\`

## Project structure
\`\`\`
apps/ai-service/
├── main.py
├── config.py
├── requirements.txt
├── routers/
│   ├── classify.py
│   ├── respond.py
│   ├── embed.py
│   └── brief.py
├── services/
│   ├── rag.py
│   ├── llm.py
│   └── sentiment.py
├── scripts/
│   └── ingest_knowledge_base.py
└── tests/
    └── test_classify.py
\`\`\`

## STEP 1 — config.py
\`\`\`python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    anthropic_api_key: str
    openai_api_key: str
    pinecone_api_key: str
    pinecone_index_name: str = "hotel-knowledge-base"
    redis_url: str = "redis://localhost:6379"
    environment: str = "development"
    
    class Config:
        env_file = ".env"

settings = Settings()
\`\`\`

## STEP 2 — services/llm.py
\`\`\`python
from anthropic import Anthropic
from openai import OpenAI

anthropic_client = Anthropic(api_key=settings.anthropic_api_key)
openai_client = OpenAI(api_key=settings.openai_api_key)

HOTEL_PERSONA = """You are the AI concierge for {hotel_name}, a professional and warm hotel assistant.
You help guests with:
- Ordering food and beverages (create orders by outputting action JSON)
- Requesting services (housekeeping, laundry, amenities)
- Answering questions about the hotel, room, amenities, and local area
- Providing recommendations based on guest preferences

Always be warm, professional, and concise. Respond in the same language the guest uses.
If you create an order or service request, include it in the actions array.

For actions, output a JSON block at the END of your response (after your text):
ACTIONS: [{"type": "create_order", "items": [...], "notes": "..."}]

If you cannot help with something, offer to connect the guest with our team."""

def generate_response(
    user_message: str,
    conversation_history: list,
    context_chunks: list[str],
    guest_profile: dict,
    hotel_name: str,
) -> tuple[str, list]:
    """Generate concierge response using Claude with RAG context."""
    
    system_prompt = HOTEL_PERSONA.format(hotel_name=hotel_name)
    
    context = "\\n\\n".join(context_chunks) if context_chunks else "No specific context available."
    
    guest_context = f"""
Current guest: {guest_profile.get('full_name', 'Valued Guest')}
Loyalty tier: {guest_profile.get('loyalty_tier', 'bronze')}
Dietary preferences: {', '.join(guest_profile.get('dietary_flags', [])) or 'None specified'}
Room: {guest_profile.get('room_number', 'Not checked in')}
"""
    
    messages = conversation_history + [
        {
            "role": "user",
            "content": f"""Hotel knowledge base context:
{context}

{guest_context}

Guest message: {user_message}"""
        }
    ]
    
    response = anthropic_client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=1024,
        system=system_prompt,
        messages=messages,
    )
    
    response_text = response.content[0].text
    
    # Extract actions from response
    actions = []
    if "ACTIONS:" in response_text:
        parts = response_text.split("ACTIONS:")
        response_text = parts[0].strip()
        try:
            import json, re
            actions_str = parts[1].strip()
            actions = json.loads(actions_str)
        except:
            actions = []
    
    return response_text, actions
\`\`\`

## STEP 3 — services/rag.py (Pinecone vector retrieval)
\`\`\`python
from pinecone import Pinecone
from openai import OpenAI
from config import settings

pc = Pinecone(api_key=settings.pinecone_api_key)
openai_client = OpenAI(api_key=settings.openai_api_key)

def get_embeddings(texts: list[str]) -> list[list[float]]:
    """Generate embeddings using OpenAI text-embedding-3-small."""
    response = openai_client.embeddings.create(
        model="text-embedding-3-small",
        input=texts,
    )
    return [item.embedding for item in response.data]

def retrieve_context(
    query: str,
    property_id: str,
    top_k: int = 5,
    min_score: float = 0.75,
) -> list[str]:
    """Retrieve relevant hotel knowledge chunks from Pinecone."""
    index = pc.Index(settings.pinecone_index_name)
    
    query_embedding = get_embeddings([query])[0]
    
    results = index.query(
        vector=query_embedding,
        top_k=top_k,
        filter={"property_id": property_id},
        include_metadata=True,
    )
    
    # Filter by minimum similarity score and extract text
    chunks = [
        match.metadata["text"]
        for match in results.matches
        if match.score >= min_score and match.metadata.get("text")
    ]
    
    return chunks

def upsert_documents(documents: list[dict], property_id: str) -> int:
    """Ingest documents into Pinecone. Each doc: { id, text, category }"""
    index = pc.Index(settings.pinecone_index_name)
    
    texts = [doc["text"] for doc in documents]
    embeddings = get_embeddings(texts)
    
    vectors = [
        {
            "id": f"{property_id}_{doc['id']}",
            "values": embedding,
            "metadata": {
                "text": doc["text"],
                "category": doc.get("category", "general"),
                "property_id": property_id,
            },
        }
        for doc, embedding in zip(documents, embeddings)
    ]
    
    # Upsert in batches of 100
    batch_size = 100
    for i in range(0, len(vectors), batch_size):
        index.upsert(vectors=vectors[i:i+batch_size])
    
    return len(vectors)
\`\`\`

## STEP 4 — services/sentiment.py
\`\`\`python
import re

# VADER-style lexicon scoring (simplified for demo)
POSITIVE_WORDS = {"great", "excellent", "amazing", "wonderful", "fantastic", "good", "nice", "perfect", "love", "happy", "satisfied", "clean", "helpful", "fast", "delicious"}
NEGATIVE_WORDS = {"bad", "terrible", "horrible", "awful", "dirty", "slow", "rude", "disappointed", "broken", "loud", "problem", "issue", "complaint", "wrong", "cold", "late"}

def score_sentiment(text: str) -> float:
    """Score text sentiment 0.0 (negative) to 1.0 (positive)."""
    text_lower = text.lower()
    words = re.findall(r'\\b\\w+\\b', text_lower)
    
    positive_count = sum(1 for w in words if w in POSITIVE_WORDS)
    negative_count = sum(1 for w in words if w in NEGATIVE_WORDS)
    
    total = positive_count + negative_count
    if total == 0:
        return 0.5  # Neutral
    
    score = positive_count / total
    # Scale to 0.1–0.9 to avoid extreme values from simple word matching
    return 0.1 + (score * 0.8)
\`\`\`

## STEP 5 — routers/classify.py
\`\`\`python
from fastapi import APIRouter
from pydantic import BaseModel
from services.sentiment import score_sentiment

router = APIRouter()

class ClassifyRequest(BaseModel):
    message: str
    conversation_history: list[dict] = []
    guest_context: dict = {}

class ClassifyResponse(BaseModel):
    intent: str
    confidence: float
    sentiment_score: float
    needs_human: bool
    sub_intent: str | None = None

# Intent keywords (production: use fine-tuned classifier)
INTENT_PATTERNS = {
    "ORDER": ["order", "bring", "send", "want", "get me", "can i have", "room service", "food", "hungry", "eat", "drink", "coffee", "tea"],
    "COMPLAINT": ["problem", "issue", "broken", "dirty", "noisy", "noise", "complaint", "terrible", "awful", "not working", "fix"],
    "HOUSEKEEPING": ["clean", "cleaning", "housekeeping", "towel", "sheets", "make up", "dnd", "do not disturb"],
    "LAUNDRY": ["laundry", "wash", "dry cleaning", "iron", "ironing"],
    "CHECKOUT": ["checkout", "check out", "bill", "invoice", "pay", "leaving"],
    "INQUIRY": ["what time", "where is", "how do i", "can you", "is there", "do you have", "what is"],
    "ESCALATE": ["speak to", "talk to", "human", "person", "manager", "supervisor", "real person"],
}

@router.post("/classify", response_model=ClassifyResponse)
async def classify_message(request: ClassifyRequest):
    message_lower = request.message.lower()
    
    intent_scores: dict[str, int] = {}
    for intent, keywords in INTENT_PATTERNS.items():
        score = sum(1 for kw in keywords if kw in message_lower)
        if score > 0:
            intent_scores[intent] = score
    
    if not intent_scores:
        detected_intent = "CHITCHAT"
        confidence = 0.6
    else:
        detected_intent = max(intent_scores, key=intent_scores.get)
        total_matches = sum(intent_scores.values())
        confidence = min(0.99, intent_scores[detected_intent] / max(total_matches, 1) * 0.9 + 0.1)
    
    sentiment = score_sentiment(request.message)
    
    return ClassifyResponse(
        intent=detected_intent,
        confidence=confidence,
        sentiment_score=sentiment,
        needs_human=detected_intent == "ESCALATE" or (detected_intent == "COMPLAINT" and confidence > 0.8),
    )
\`\`\`

## STEP 6 — routers/respond.py
\`\`\`python
from fastapi import APIRouter
from pydantic import BaseModel
from services.rag import retrieve_context
from services.llm import generate_response
from services.sentiment import score_sentiment

router = APIRouter()

class RespondRequest(BaseModel):
    message: str
    reservation_id: str
    property_id: str
    session_id: str
    conversation_history: list[dict] = []
    guest_profile: dict = {}

class RespondResponse(BaseModel):
    response_text: str
    actions: list[dict]
    intent: str
    confidence: float
    sentiment_score: float
    needs_human: bool
    follow_up_suggestions: list[str]

@router.post("/respond", response_model=RespondResponse)
async def generate_concierge_response(request: RespondRequest):
    # Step 1: retrieve relevant context from Pinecone
    context_chunks = retrieve_context(
        query=request.message,
        property_id=request.property_id,
        top_k=5,
    )
    
    # Step 2: generate response
    response_text, actions = generate_response(
        user_message=request.message,
        conversation_history=request.conversation_history,
        context_chunks=context_chunks,
        guest_profile=request.guest_profile,
        hotel_name=request.guest_profile.get("hotel_name", "Hotel"),
    )
    
    sentiment = score_sentiment(request.message)
    
    # Step 3: generate follow-up suggestions based on context
    suggestions = generate_suggestions(request.message, actions)
    
    return RespondResponse(
        response_text=response_text,
        actions=actions,
        intent="ORDER" if actions else "INQUIRY",
        confidence=0.92,
        sentiment_score=sentiment,
        needs_human=False,
        follow_up_suggestions=suggestions,
    )

def generate_suggestions(message: str, actions: list) -> list[str]:
    suggestions = []
    if actions:
        suggestions.append("Track my order")
    suggestions.extend(["What's the checkout time?", "Local restaurant recommendations"])
    return suggestions[:3]
\`\`\`

## STEP 7 — routers/embed.py (knowledge base ingestion)
\`\`\`python
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.rag import upsert_documents

router = APIRouter()

class EmbedRequest(BaseModel):
    property_id: str
    documents: list[dict]  # [{ id, text, category }]

@router.post("/embed")
async def embed_documents(request: EmbedRequest):
    if not request.documents:
        raise HTTPException(status_code=400, detail="No documents provided")
    
    count = upsert_documents(request.documents, request.property_id)
    return { "success": True, "documents_indexed": count }
\`\`\`

## STEP 8 — routers/brief.py (staff guest brief)
\`\`\`python
from fastapi import APIRouter
from pydantic import BaseModel
import anthropic

router = APIRouter()
client = anthropic.Anthropic()

class BriefRequest(BaseModel):
    guest: dict
    recent_stays: list[dict] = []
    recent_feedback: list[dict] = []
    preferences: dict = {}

@router.post("/guest-brief")
async def generate_guest_brief(request: BriefRequest):
    prompt = f"""Generate a brief 2-paragraph staff briefing for this hotel guest. 
Be specific, actionable, and warm. Focus on what staff need to know to deliver a great experience.

Guest: {request.guest.get('full_name')}
Tier: {request.guest.get('loyalty_tier', 'bronze')} ({request.guest.get('total_stays', 0)} stays)
Dietary: {request.guest.get('dietary_flags', [])}
Recent feedback: {request.recent_feedback[:3]}
Preferences: {request.preferences}

Write 2 short paragraphs. First: who they are and what they value. Second: specific things staff should do."""

    response = client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=300,
        messages=[{"role": "user", "content": prompt}],
    )
    
    return { "brief": response.content[0].text }
\`\`\`

## STEP 9 — main.py
\`\`\`python
from fastapi import FastAPI
from routers import classify, respond, embed, brief

app = FastAPI(title="Hotel OS AI Service", version="1.0.0")

app.include_router(classify.router, prefix="/api/v1")
app.include_router(respond.router, prefix="/api/v1")
app.include_router(embed.router, prefix="/api/v1")
app.include_router(brief.router, prefix="/api/v1")

@app.get("/health")
async def health(): return { "status": "ok", "service": "ai-service" }
\`\`\`

## STEP 10 — Knowledge base ingestion script
Create scripts/ingest_knowledge_base.py that:
1. Reads a JSON file of hotel knowledge (menu items, policies, FAQ, room descriptions)
2. Chunks long text into 400-token segments
3. Calls POST /embed to upsert all chunks
4. Reports: X documents ingested in Y seconds

## Acceptance criteria
- POST /classify returns correct intent for: "order a pizza", "my AC is broken", "what time is checkout"
- POST /respond returns response_text + actions array when order intent detected
- POST /embed successfully upserts documents to Pinecone
- POST /guest-brief returns 2-paragraph brief in under 5 seconds
- All endpoints return 200 with correct response shape`
},

// ─────────────────────────────────────────────────────────
{ num:'T-08', title:'payments-service — Razorpay & invoicing', phase:'Phase 1 · Wk 4', effort:'2 days', color:C.coral,
  objective:'Build the payments-service handling Razorpay payment integration, checkout payment verification, invoice PDF generation, and email delivery via SendGrid.',
  dependencies:'T-01, T-02, T-04',
  outputs:['POST /api/v1/payments/create-order — create Razorpay order','POST /api/v1/payments/verify — verify Razorpay payment signature','GET /api/v1/payments/invoice/:reservationId — download invoice PDF','BullMQ worker for invoice generation + email after checkout event','PDF invoice with hotel branding, itemised charges'],
  prompt:`Build the payments-service for Hotel OS. Handles Razorpay integration, invoice PDF generation, and email delivery.

## Dependencies
\`\`\`bash
cd services/payments-service
pnpm add fastify @fastify/cors @fastify/jwt @fastify/helmet
pnpm add @prisma/client bullmq ioredis razorpay zod pino
pnpm add pdfkit @sendgrid/mail aws-sdk
\`\`\`

## STEP 1 — Razorpay integration (src/lib/razorpay.ts)
\`\`\`typescript
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { config } from '../config.js';

export const razorpay = new Razorpay({
  key_id: config.RAZORPAY_KEY_ID,
  key_secret: config.RAZORPAY_KEY_SECRET,
});

export async function createPaymentOrder(params: {
  amount: number;  // in paise (₹1 = 100 paise)
  currency: string;
  reservationId: string;
  guestPhone: string;
}): Promise<{ id: string; amount: number; currency: string }> {
  const order = await razorpay.orders.create({
    amount: Math.round(params.amount * 100), // Convert to paise
    currency: params.currency || 'INR',
    receipt: params.reservationId.slice(0, 40),
    notes: {
      reservation_id: params.reservationId,
      guest_phone: params.guestPhone,
    },
  });
  return { id: order.id as string, amount: order.amount as number, currency: order.currency as string };
}

export function verifyPaymentSignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const body = \`\${params.orderId}|\${params.paymentId}\`;
  const expected = crypto
    .createHmac('sha256', config.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');
  return expected === params.signature;
}
\`\`\`

## STEP 2 — Invoice PDF generation (src/lib/invoice.ts)
\`\`\`typescript
import PDFDocument from 'pdfkit';
import { Readable } from 'stream';

interface InvoiceData {
  invoiceNumber: string;
  hotelName: string;
  hotelAddress: string;
  guestName: string;
  guestEmail?: string;
  roomNumber: string;
  checkIn: string;
  checkOut: string;
  lineItems: Array<{
    description: string;
    quantity: number;
    amount: number;
    date: string;
  }>;
  subtotals: { room: number; fnb: number; other: number };
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  generatedAt: string;
}

export function generateInvoicePdf(data: InvoiceData): Buffer {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  const buffers: Buffer[] = [];
  
  doc.on('data', (chunk) => buffers.push(chunk));
  
  // Header
  doc.fontSize(24).font('Helvetica-Bold').text(data.hotelName, 50, 50);
  doc.fontSize(10).font('Helvetica').fillColor('#666666').text(data.hotelAddress, 50, 82);
  
  // Invoice title
  doc.fontSize(20).font('Helvetica-Bold').fillColor('#1B2A4A').text('TAX INVOICE', 400, 50, { align: 'right' });
  doc.fontSize(10).font('Helvetica').fillColor('#666666').text(\`Invoice #: \${data.invoiceNumber}\`, 400, 78, { align: 'right' });
  doc.text(\`Date: \${data.generatedAt}\`, 400, 92, { align: 'right' });
  
  // Horizontal line
  doc.moveTo(50, 120).lineTo(545, 120).strokeColor('#1B2A4A').lineWidth(2).stroke();
  
  // Guest info
  doc.fontSize(12).font('Helvetica-Bold').fillColor('#1B2A4A').text('GUEST DETAILS', 50, 135);
  doc.fontSize(10).font('Helvetica').fillColor('#333333');
  doc.text(\`Name: \${data.guestName}\`, 50, 155);
  doc.text(\`Room: \${data.roomNumber}\`, 50, 170);
  doc.text(\`Check-in: \${data.checkIn}\`, 50, 185);
  doc.text(\`Check-out: \${data.checkOut}\`, 50, 200);
  
  // Line items table header
  doc.rect(50, 230, 495, 20).fill('#1B2A4A');
  doc.fontSize(9).font('Helvetica-Bold').fillColor('white');
  doc.text('Description', 60, 236);
  doc.text('Date', 320, 236);
  doc.text('Amount (₹)', 460, 236, { align: 'right', width: 75 });
  
  // Line items
  let y = 260;
  doc.font('Helvetica').fillColor('#333333').fontSize(9);
  
  data.lineItems.forEach((item, i) => {
    if (i % 2 === 1) doc.rect(50, y - 3, 495, 18).fill('#F4F6FA');
    doc.fillColor('#333333').text(item.description, 60, y, { width: 250 });
    doc.text(item.date, 320, y);
    doc.text(\`₹ \${item.amount.toLocaleString('en-IN')}\`, 460, y, { align: 'right', width: 75 });
    y += 20;
  });
  
  // Subtotals
  y += 10;
  doc.moveTo(50, y).lineTo(545, y).strokeColor('#CCCCCC').lineWidth(0.5).stroke();
  y += 15;
  
  [
    ['Room Charges', data.subtotals.room],
    ['Food & Beverage', data.subtotals.fnb],
    ['Other Services', data.subtotals.other],
  ].forEach(([label, amount]) => {
    doc.text(String(label), 380, y);
    doc.text(\`₹ \${Number(amount).toLocaleString('en-IN')}\`, 460, y, { align: 'right', width: 75 });
    y += 16;
  });
  
  // Total box
  y += 5;
  doc.rect(380, y, 165, 24).fill('#1B2A4A');
  doc.font('Helvetica-Bold').fontSize(11).fillColor('white');
  doc.text('TOTAL', 390, y + 7);
  doc.text(\`₹ \${data.totalAmount.toLocaleString('en-IN')}\`, 460, y + 7, { align: 'right', width: 75 });
  
  if (data.balanceDue > 0) {
    y += 30;
    doc.fillColor('#993C1D').fontSize(10).text(\`Balance Due: ₹ \${data.balanceDue.toLocaleString('en-IN')}\`, 380, y, { align: 'right', width: 165 });
  }
  
  // Footer
  doc.fontSize(8).fillColor('#999999').text('Thank you for staying with us. We look forward to welcoming you again.', 50, 750, { align: 'center', width: 495 });
  
  doc.end();
  return Buffer.concat(buffers);
}
\`\`\`

## STEP 3 — REST endpoints (src/routes/payment.routes.ts)

### POST /api/v1/payments/create-order
\`\`\`typescript
const CreateOrderSchema = z.object({
  reservation_id: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.string().default('INR'),
});
\`\`\`
Creates Razorpay order. Returns { razorpay_order_id, amount, currency, key_id }.

### POST /api/v1/payments/verify
\`\`\`typescript
const VerifySchema = z.object({
  reservation_id: z.string().uuid(),
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
});
\`\`\`

Logic:
1. Verify signature using verifyPaymentSignature()
2. If invalid: return 400 { error: { code: 'PAYMENT_FAILED' } }
3. Update reservation.paidAmount in database
4. If paidAmount >= totalAmount: trigger checkout flow (emit booking.checked_out event)
5. Return { success: true, payment_id, amount_paid }

### GET /api/v1/payments/invoice/:reservationId
Logic:
1. Fetch reservation with all orders and room data
2. Generate PDF via generateInvoicePdf()
3. Upload to S3 as invoices/{reservationId}.pdf
4. Return { invoice_url, generated_at }

## STEP 4 — BullMQ worker for post-checkout processing
Listen to booking-events queue for booking.checked_out:
1. Generate invoice PDF
2. Upload to S3
3. Send email via SendGrid to guest
4. Update reservation with invoice URL

SendGrid email template should include:
- Invoice PDF as attachment
- "Thank you for your stay" message
- Loyalty points earned this stay
- Points balance and tier progress

## Acceptance criteria
- POST /payments/create-order returns valid Razorpay order ID
- Tampered signature returns 400 PAYMENT_FAILED
- Invoice PDF generates without errors for reservation with 5+ line items
- Invoice uploaded to S3 and URL returned
- Email with PDF attachment sent within 30 seconds of checkout`
},

// ─────────────────────────────────────────────────────────
{ num:'T-09', title:'loyalty-service — points engine & tiers', phase:'Phase 1/2 · Wk 4', effort:'2 days', color:C.green,
  objective:'Build the loyalty-service with an event-sourced points ledger, configurable earn rules, tier calculation, and redemption processing. Uses append-only transaction log for auditability.',
  dependencies:'T-01, T-02, T-03',
  outputs:['GET /api/v1/loyalty/summary','GET /api/v1/loyalty/statement','POST /api/v1/loyalty/redeem','BullMQ worker: booking.checked_out → credit earn points','BullMQ worker: nightly expiry job for expired points','Tier upgrade/downgrade logic'],
  prompt:`Build the loyalty-service for Hotel OS. Implements an event-sourced points ledger with tier management.

## Dependencies
\`\`\`bash
cd services/loyalty-service
pnpm add fastify @fastify/cors @fastify/jwt @fastify/helmet
pnpm add @prisma/client bullmq ioredis zod pino node-cron
\`\`\`

## STEP 1 — Core loyalty logic (src/lib/loyalty.ts)
\`\`\`typescript
export const TIER_THRESHOLDS = {
  silver: 1000,
  gold: 5000,
  platinum: 15000,  // lifetime points
} as const;

export const TIER_EARN_MULTIPLIERS = {
  bronze: 1.0,
  silver: 1.2,
  gold: 1.5,
  platinum: 2.0,
} as const;

export type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export function calculateTier(lifetimePoints: number): LoyaltyTier {
  if (lifetimePoints >= TIER_THRESHOLDS.platinum) return 'platinum';
  if (lifetimePoints >= TIER_THRESHOLDS.gold) return 'gold';
  if (lifetimePoints >= TIER_THRESHOLDS.silver) return 'silver';
  return 'bronze';
}

export function calculatePointsToEarn(params: {
  spendAmount: number;
  earnRate: number;      // property earn rate (points per ₹100)
  tier: LoyaltyTier;
  category: 'room' | 'fnb' | 'other';
}): number {
  const basePoints = Math.floor((params.spendAmount / 100) * params.earnRate);
  const multiplier = TIER_EARN_MULTIPLIERS[params.tier];
  
  // F&B earns 2x base
  const categoryMultiplier = params.category === 'fnb' ? 2 : 1;
  
  return Math.floor(basePoints * multiplier * categoryMultiplier);
}

export function pointsToValue(points: number): number {
  return points / 10;  // 10 points = ₹1
}

export function valueTOPoints(rupees: number): number {
  return rupees * 10;
}
\`\`\`

## STEP 2 — Points ledger service (src/services/ledger.service.ts)
\`\`\`typescript
export class LedgerService {
  constructor(private prisma: PrismaClient) {}

  async creditPoints(params: {
    guestId: string;
    propertyId: string;
    reservationId?: string;
    points: number;
    type: 'earn' | 'bonus' | 'referral';
    reason: string;
    referenceId?: string;
    expiresAt?: Date;
  }): Promise<void> {
    // Get current balance
    const guest = await this.prisma.guest.findUniqueOrThrow({
      where: { id: params.guestId },
    });

    const newBalance = guest.loyaltyPoints + params.points;
    const newLifetime = guest.lifetimePoints + params.points;
    const newTier = calculateTier(newLifetime);

    // Create immutable transaction record
    await this.prisma.loyaltyTransaction.create({
      data: {
        guestId: params.guestId,
        propertyId: params.propertyId,
        reservationId: params.reservationId,
        type: params.type,
        points: params.points,
        balanceAfter: newBalance,
        reason: params.reason,
        referenceId: params.referenceId,
        expiresAt: params.expiresAt,
      },
    });

    // Update denormalized balance on guest
    await this.prisma.guest.update({
      where: { id: params.guestId },
      data: {
        loyaltyPoints: newBalance,
        lifetimePoints: newLifetime,
        loyaltyTier: newTier as any,
      },
    });
  }

  async redeemPoints(params: {
    guestId: string;
    propertyId: string;
    reservationId: string;
    points: number;
    reason: string;
  }): Promise<{ success: boolean; newBalance: number; rupeesValue: number }> {
    const guest = await this.prisma.guest.findUniqueOrThrow({
      where: { id: params.guestId },
    });

    if (guest.loyaltyPoints < params.points) {
      return { success: false, newBalance: guest.loyaltyPoints, rupeesValue: 0 };
    }

    if (params.points < 500) {
      throw new Error('Minimum redemption is 500 points');
    }

    const newBalance = guest.loyaltyPoints - params.points;

    await this.prisma.loyaltyTransaction.create({
      data: {
        guestId: params.guestId,
        propertyId: params.propertyId,
        reservationId: params.reservationId,
        type: 'redeem',
        points: -params.points,  // Negative for debit
        balanceAfter: newBalance,
        reason: params.reason,
      },
    });

    await this.prisma.guest.update({
      where: { id: params.guestId },
      data: { loyaltyPoints: newBalance },
    });

    return {
      success: true,
      newBalance,
      rupeesValue: pointsToValue(params.points),
    };
  }
}
\`\`\`

## STEP 3 — REST endpoints

### GET /api/v1/loyalty/summary (guest JWT)
\`\`\`typescript
// Response:
{
  current_points: number;
  lifetime_points: number;
  tier: string;
  next_tier: string | null;
  points_to_next_tier: number;
  tier_progress_pct: number;
  points_expiring_soon: { amount: number; expiry_date: string } | null;
  this_stay_earned: number;     // points earned in active reservation
  redemption_value: number;     // ₹ value of current points
  tier_benefits: string[];
}
\`\`\`

### GET /api/v1/loyalty/statement (guest JWT)
Paginated list of loyalty transactions:
\`\`\`typescript
{
  data: Array<{
    id: string;
    type: 'earn' | 'redeem' | 'expire' | 'bonus';
    points: number;
    balance_after: number;
    reason: string;
    created_at: string;
  }>;
  meta: { page: number; per_page: number; total: number };
}
\`\`\`

### POST /api/v1/loyalty/redeem (guest JWT)
\`\`\`typescript
const RedeemSchema = z.object({
  reservation_id: z.string().uuid(),
  points: z.number().int().min(500),
  apply_to: z.enum(['folio', 'fnb_order']),
});
\`\`\`
Call ledgerService.redeemPoints(). On success, create a negative folio line item on the reservation.

## STEP 4 — BullMQ worker (booking.checked_out → earn points)
\`\`\`typescript
case 'booking.checked_out': {
  const { reservationId, guestId, propertyId, totalAmount, fnbAmount, otherAmount } = job.data;
  
  const guest = await prisma.guest.findUnique({ where: { id: guestId }, include: { property: true } });
  const earnRate = guest?.property.loyaltyEarnRate ?? 1;
  const tier = guest?.loyaltyTier ?? 'bronze';
  
  const roomAmount = totalAmount - fnbAmount - otherAmount;
  const roomPoints = calculatePointsToEarn({ spendAmount: roomAmount, earnRate, tier, category: 'room' });
  const fnbPoints = calculatePointsToEarn({ spendAmount: fnbAmount, earnRate, tier, category: 'fnb' });
  const totalPoints = roomPoints + fnbPoints;
  
  if (totalPoints > 0) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (guest?.property.pointsExpiryDays ?? 365));
    
    await ledgerService.creditPoints({
      guestId,
      propertyId,
      reservationId,
      points: totalPoints,
      type: 'earn',
      reason: \`Stay earnings — room: \${roomPoints} pts, F&B: \${fnbPoints} pts\`,
      expiresAt,
    });
  }
  
  // App check-in bonus
  await ledgerService.creditPoints({
    guestId, propertyId, reservationId,
    points: 50, type: 'bonus',
    reason: 'App check-in bonus',
  });
  
  break;
}
\`\`\`

## STEP 5 — Nightly expiry job (node-cron)
Run at 00:05 daily:
1. Find all loyalty_transactions WHERE isExpired = false AND expiresAt <= today
2. For each expired batch per guest: sum expired points, create negative transaction (type: expire)
3. Update guest.loyaltyPoints by subtracting expired amount
4. Set isExpired = true on processed transactions

## Acceptance criteria
- Guest with 0 points checks out with ₹10,000 bill → 100+ points credited
- Gold tier guest earns 1.5x points vs bronze tier on same spend
- Redeem below 500 points returns error
- Redeem success reduces guest balance immediately
- Points expiry job runs and creates expire transaction for qualifying records`
},

// ─────────────────────────────────────────────────────────
{ num:'T-10', title:'Guest app — React Native scaffold & auth screens', phase:'Phase 1 · Wk 2', effort:'2 days', color:C.blue,
  objective:'Scaffold the React Native Expo app with navigation, design system, Zustand state management, and build the complete authentication flow: splash screen → phone number entry → OTP verification → home.',
  dependencies:'T-01, T-03',
  outputs:['apps/mobile/ complete Expo 51 scaffold','packages/ui/ shared component library (Button, TextInput, Card, Badge, LoadingSpinner)','Zustand auth store with JWT management + MMKV persistence','Splash screen, phone entry screen, OTP verification screen with countdown','Navigation structure: AuthStack + AppStack (tabs)','API client with axios + automatic token refresh'],
  prompt:`Build the React Native guest app scaffold and complete authentication flow for Hotel OS.

## Setup
\`\`\`bash
cd apps/mobile
npx create-expo-app . --template blank-typescript
pnpm add @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs
pnpm add zustand react-native-mmkv axios zod react-native-safe-area-context
pnpm add expo-font expo-splash-screen expo-haptics expo-local-authentication
pnpm add react-native-screens react-native-gesture-handler react-native-reanimated
pnpm add @expo/vector-icons
pnpm add -D @types/react @types/react-native
\`\`\`

## STEP 1 — Design tokens (src/theme/tokens.ts)
\`\`\`typescript
export const Colors = {
  // Brand
  navy: '#1B2A4A',
  teal: '#0F6E56',
  amber: '#BA7517',
  coral: '#993C1D',
  
  // Semantic
  primary: '#0F6E56',
  primaryLight: '#E1F5EE',
  danger: '#A32D2D',
  warning: '#854F0B',
  success: '#27500A',
  
  // Neutrals
  background: '#FFFFFF',
  surface: '#F4F6FA',
  border: '#DDE3EE',
  text: '#1B2A4A',
  textSecondary: '#5A6170',
  textTertiary: '#9BA3AE',
  
  // Tier colours
  bronze: '#CD7F32',
  silver: '#A8A8A8',
  gold: '#BA7517',
  platinum: '#534AB7',
} as const;

export const Typography = {
  h1: { fontSize: 28, fontWeight: '700' as const, color: Colors.navy },
  h2: { fontSize: 22, fontWeight: '600' as const, color: Colors.navy },
  h3: { fontSize: 18, fontWeight: '600' as const, color: Colors.navy },
  body: { fontSize: 15, fontWeight: '400' as const, color: Colors.text },
  small: { fontSize: 13, fontWeight: '400' as const, color: Colors.textSecondary },
  tiny: { fontSize: 11, fontWeight: '400' as const, color: Colors.textTertiary },
} as const;

export const Spacing = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32,
} as const;

export const Radius = {
  sm: 6, md: 10, lg: 14, xl: 20, full: 9999,
} as const;
\`\`\`

## STEP 2 — packages/ui shared components
Create these components in packages/ui/src/:

### Button.tsx
\`\`\`typescript
interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
}
\`\`\`
- primary: teal background, white text
- secondary: teal border, teal text, white bg
- ghost: no border, teal text
- Loading state shows ActivityIndicator
- Haptic feedback on press (expo-haptics)

### TextInput.tsx
\`\`\`typescript
interface TextInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: KeyboardTypeOptions;
  error?: string;
  leftIcon?: React.ReactNode;
  secureTextEntry?: boolean;
  maxLength?: number;
}
\`\`\`
- Shows label above, error message below
- Red border + error text when error prop present

### OtpInput.tsx
6-digit OTP input using 6 individual TextInput cells. Auto-advance on each digit. Auto-submit when all 6 filled. Paste support.

### Card.tsx, Badge.tsx, LoadingSpinner.tsx, EmptyState.tsx

## STEP 3 — API client (src/lib/api.ts)
\`\`\`typescript
import axios from 'axios';
import { storage } from './storage.js';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: \`\${BASE_URL}/api/v1\`,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: attach JWT
api.interceptors.request.use((config) => {
  const token = storage.getString('access_token');
  if (token) config.headers.Authorization = \`Bearer \${token}\`;
  return config;
});

// Response interceptor: handle 401, refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      try {
        const refreshToken = storage.getString('refresh_token');
        const { data } = await axios.post(\`\${BASE_URL}/api/v1/auth/refresh\`, {
          refresh_token: refreshToken,
        });
        storage.set('access_token', data.access_token);
        storage.set('refresh_token', data.refresh_token);
        error.config.headers.Authorization = \`Bearer \${data.access_token}\`;
        return api(error.config);
      } catch {
        // Refresh failed — clear auth and redirect to login
        storage.delete('access_token');
        storage.delete('refresh_token');
        // Emit logout event
      }
    }
    return Promise.reject(error);
  }
);
\`\`\`

## STEP 4 — Zustand auth store (src/stores/auth.store.ts)
\`\`\`typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { storage } from '../lib/storage.js';
import { api } from '../lib/api.js';

interface AuthState {
  guest: Guest | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  sendOtp: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, otp: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      guest: null,
      isAuthenticated: false,
      isLoading: false,

      sendOtp: async (phone) => {
        set({ isLoading: true });
        await api.post('/auth/otp/send', { phone });
        set({ isLoading: false });
      },

      verifyOtp: async (phone, otp) => {
        set({ isLoading: true });
        const { data } = await api.post('/auth/otp/verify', { phone, otp });
        storage.set('access_token', data.access_token);
        storage.set('refresh_token', data.refresh_token);
        set({ guest: data.guest, isAuthenticated: true, isLoading: false });
      },

      logout: async () => {
        await api.post('/auth/logout').catch(() => {});
        storage.delete('access_token');
        storage.delete('refresh_token');
        set({ guest: null, isAuthenticated: false });
      },

      refreshProfile: async () => {
        const { data } = await api.get('/guests/me');
        set({ guest: data });
      },
    }),
    {
      name: 'auth-store',
      storage: createJSONStorage(() => ({
        getItem: (key) => storage.getString(key) ?? null,
        setItem: (key, value) => storage.set(key, value),
        removeItem: (key) => storage.delete(key),
      })),
      partialize: (state) => ({ guest: state.guest, isAuthenticated: state.isAuthenticated }),
    }
  )
);
\`\`\`

## STEP 5 — Navigation structure (src/navigation/)

### RootNavigator.tsx
\`\`\`typescript
export function RootNavigator() {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <AppNavigator /> : <AuthNavigator />;
}
\`\`\`

### AuthNavigator.tsx — screens: Splash, PhoneEntry, OtpVerification

### AppNavigator.tsx — bottom tab navigator with:
- Home tab (icon: home)
- Services tab (icon: grid — F&B, housekeeping, laundry)
- Key tab (icon: key — mobile room key)
- Concierge tab (icon: message-circle — AI chat)
- Account tab (icon: user — profile, loyalty, bills)

## STEP 6 — Auth screens

### SplashScreen.tsx
- Hotel OS logo centred
- Animated fade in
- Auto-navigate to PhoneEntry after 2 seconds (or to Home if already authenticated)

### PhoneEntryScreen.tsx
- Flag + country code selector (default India +91)
- Phone number input (numeric keyboard)
- "Send OTP" button
- Call sendOtp(phone). On success, navigate to OtpVerification
- Error handling: show toast for rate limit errors

### OtpVerificationScreen.tsx
- "Enter the 6-digit code sent to {phone}" heading
- OtpInput component
- 60-second countdown timer. "Resend OTP" after countdown
- Auto-verify when all 6 digits entered
- Loading state during verification
- Error: "Incorrect OTP. X attempts remaining"
- On success: navigate to App

## Acceptance criteria
- App starts and shows SplashScreen for 2s
- Entering valid phone and tapping "Send OTP" calls API and navigates to OTP screen
- OTP input auto-advances between cells and auto-submits on last digit
- Successful OTP verification stores tokens and navigates to App
- Closing and reopening app shows App (not Auth) if tokens valid
- Invalid OTP shows error message with attempts remaining counter`
},

// ─────────────────────────────────────────────────────────
{ num:'T-11', title:'Guest app — Home screen, reservation & folio', phase:'Phase 1 · Wk 3', effort:'2 days', color:C.blue,
  objective:'Build the contextual home screen that changes based on guest state (no reservation / pre-arrival / checked-in / checked-out), the reservation detail screen, and the itemised folio view with live balance.',
  dependencies:'T-10, T-04',
  outputs:['HomeScreen.tsx — contextual content based on reservation status','ReservationScreen.tsx — full reservation details','FolioScreen.tsx — itemised bill with running balance','useReservationStore (Zustand) — reservation state + polling','Loyalty points widget in home header'],
  prompt:`Build the Hotel OS guest app home screen, reservation detail, and folio screens.

## Context
This builds on T-10 (app scaffold). The home screen is the first screen guests see after login. Its content is completely different based on their reservation status.

## STEP 1 — Reservation store (src/stores/reservation.store.ts)
\`\`\`typescript
interface ReservationState {
  reservation: Reservation | null;
  folio: FolioResponse | null;
  isLoading: boolean;
  lastFetched: number | null;

  fetchActiveReservation: () => Promise<void>;
  fetchFolio: (reservationId: string) => Promise<void>;
  updateDnd: (enabled: boolean) => Promise<void>;
}
\`\`\`

- fetchActiveReservation calls GET /api/v1/reservations/active
- Auto-refresh every 5 minutes when app is in foreground (AppState listener)
- Cache in Zustand (no need to refetch if < 5 min since last fetch)

## STEP 2 — HomeScreen.tsx (src/screens/Home/HomeScreen.tsx)

The home screen renders one of 4 contextual states:

### State 1: No reservation
\`\`\`
┌─────────────────────────────────────┐
│  Good evening, Priya  ·  🏆 4,820 pts  │  ← Header with greeting + points
├─────────────────────────────────────┤
│  [  Book your next stay  →  ]       │  ← CTA card
│                                     │
│  📋 Past stays (2)                  │  ← Quick link
└─────────────────────────────────────┘
\`\`\`

### State 2: Reservation confirmed (pre-arrival)
\`\`\`
┌─────────────────────────────────────┐
│  Welcome back, Priya  ·  🏆 4,820   │
├─────────────────────────────────────┤
│  ┌─────────────────────────────┐   │
│  │ The Grand Chennai           │   │
│  │ Nov 15–17 · Deluxe King     │   │
│  │ ⏰ Check-in in 2 days       │   │
│  │ [  Complete check-in  →  ]  │   │  ← Pre-checkin CTA
│  └─────────────────────────────┘   │
│  🌤 Chennai · 32°C · Sunny         │  ← Weather widget
└─────────────────────────────────────┘
\`\`\`

### State 3: Checked in (ACTIVE STAY — most feature-rich)
\`\`\`
┌─────────────────────────────────────┐
│  Welcome, Priya  ·  Room 412  ·  🏆  │
├─────────────────────────────────────┤
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐       │
│  │ 🍽 │ │ 🧹 │ │ 👔 │ │ 🤖 │       │  ← Quick actions grid
│  │Food│ │Clean│ │Laun │ │Chat│       │
│  └────┘ └────┘ └────┘ └────┘       │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐       │
│  │ 🔑 │ │ 📊 │ │ 🛎 │ │ ⛔ │       │
│  │ Key│ │Bill │ │Ameni│ │DND │       │
│  └────┘ └────┘ └────┘ └────┘       │
├─────────────────────────────────────┤
│  Active orders (2)                  │  ← Live order tracker
│  ● Club Sandwich · Preparing · 8min │
│  ● Laundry · Collected             │
└─────────────────────────────────────┘
\`\`\`

### State 4: Checked out
\`\`\`
┌─────────────────────────────────────┐
│  Thanks for staying, Priya!         │
├─────────────────────────────────────┤
│  ⭐ Rate your stay                  │  ← Feedback CTA
│  +148 pts earned this stay          │  ← Loyalty earned
│  [  Download invoice  ]             │
│  [  Book again  →  ]               │
└─────────────────────────────────────┘
\`\`\`

Implementation notes:
- Use useFocusEffect to refresh reservation on screen focus
- Quick action grid items are TouchableOpacity cards with icon + label
- Tapping any quick action navigates to correct tab/screen
- Active orders section shows real-time Socket.io updated orders

## STEP 3 — Quick action grid component (src/components/QuickActionGrid.tsx)
\`\`\`typescript
const QUICK_ACTIONS = [
  { id: 'food',      label: 'Food',      icon: 'utensils',   screen: 'Menu',          tab: 'Services' },
  { id: 'clean',     label: 'Housekeep', icon: 'sparkles',   screen: 'Housekeeping',  tab: 'Services' },
  { id: 'laundry',   label: 'Laundry',   icon: 'shirt',      screen: 'Laundry',       tab: 'Services' },
  { id: 'concierge', label: 'Concierge', icon: 'message',    screen: 'Concierge',     tab: 'Concierge' },
  { id: 'key',       label: 'Room Key',  icon: 'key',        screen: 'Key',           tab: 'Key' },
  { id: 'folio',     label: 'My Bill',   icon: 'file-text',  screen: 'Folio',         tab: 'Account' },
  { id: 'amenity',   label: 'Amenities', icon: 'package',    screen: 'Amenities',     tab: 'Services' },
  { id: 'dnd',       label: 'Do Not\nDisturb', icon: 'bell-off', action: 'toggleDnd', tab: null },
] as const;
\`\`\`

Each tile: rounded card (Radius.lg), icon centred (36px), label below (12px). 4 columns × 2 rows.

## STEP 4 — ReservationScreen.tsx
Shows full reservation detail:
- Room type, floor, amenities (pool_view etc as badge chips)
- Check-in / checkout dates with nights count
- Rate plan badge (CP / EP / AP / MAP)
- Status badge (Confirmed / Pre-checked in / Checked in / Checked out)
- Special requests display
- "Complete check-in" or "View mobile key" CTA based on status

## STEP 5 — FolioScreen.tsx
Shows itemised bill:
- Running balance header: "₹8,340 due" in large type
- Grouped by category (Room charges / Food & Beverage / Other)
- Each line item: description + date on left, amount right
- Subtotals per category
- Total + paid amount + balance due
- "Pay now" button if balance > 0 (navigates to payment)
- "Download invoice" button (calls GET /payments/invoice/:id, opens PDF)

## STEP 6 — Home screen header with greeting and loyalty widget
\`\`\`typescript
function HomeHeader({ guest, reservation }: Props) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  
  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.greeting}>{greeting}, {guest.fullName.split(' ')[0]}</Text>
        {reservation?.roomNumber && (
          <Text style={styles.roomText}>Room {reservation.roomNumber}</Text>
        )}
      </View>
      <TouchableOpacity onPress={() => navigation.navigate('Loyalty')} style={styles.pointsBadge}>
        <Text style={styles.pointsText}>🏆 {guest.loyaltyPoints.toLocaleString()}</Text>
        <Text style={styles.tierText}>{guest.loyaltyTier.toUpperCase()}</Text>
      </TouchableOpacity>
    </View>
  );
}
\`\`\`

## Acceptance criteria
- No-reservation state shows correct empty state with book CTA
- Pre-arrival state shows check-in countdown and digital check-in button
- Checked-in state shows full quick action grid
- Checked-out state shows feedback CTA + points earned
- Quick action grid navigates to correct screen on tap
- Folio screen shows live balance updated within 60 seconds of new order
- DND toggle tile shows green when active, grey when inactive`
},

// ─────────────────────────────────────────────────────────
{ num:'T-12', title:'Guest app — Menu, ordering & order tracking', phase:'Phase 1 · Wk 3', effort:'2 days', color:C.blue,
  objective:'Build the complete F&B ordering experience: menu browser with AI recommendations, cart management, order placement, and real-time Socket.io order tracking with live status updates.',
  dependencies:'T-10, T-11, T-05',
  outputs:['MenuScreen.tsx — category tabs, menu items, AI recommendations','CartScreen.tsx — cart management with item notes','OrderPlacementFlow.tsx — payment method + confirm','ActiveOrdersScreen.tsx — live order tracker via Socket.io','OrderHistoryScreen.tsx — past orders with reorder'],
  prompt:`Build the complete F&B ordering flow for Hotel OS mobile app.

## STEP 1 — Orders store (src/stores/orders.store.ts)
\`\`\`typescript
interface CartItem {
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  notes: string;
}

interface OrdersState {
  cart: CartItem[];
  activeOrders: Order[];
  orderHistory: Order[];
  
  addToCart: (item: CartItem) => void;
  removeFromCart: (menuItemId: string) => void;
  updateCartItem: (menuItemId: string, quantity: number, notes: string) => void;
  clearCart: () => void;
  cartTotal: () => number;
  
  placeOrder: (reservationId: string, paymentMethod: string, notes?: string) => Promise<Order>;
  fetchActiveOrders: (reservationId: string) => Promise<void>;
  updateOrderStatus: (orderId: string, status: string) => void; // called by Socket.io
  rateOrder: (orderId: string, rating: number, feedback?: string) => Promise<void>;
}
\`\`\`

## STEP 2 — Socket.io client (src/lib/socket.ts)
\`\`\`typescript
import { io, Socket } from 'socket.io-client';
import { storage } from './storage.js';

let socket: Socket | null = null;

export function connectSocket(reservationId: string): Socket {
  if (socket?.connected) return socket;
  
  socket = io(process.env.EXPO_PUBLIC_ORDERS_WS_URL || 'ws://localhost:3003', {
    auth: { token: storage.getString('access_token') },
    transports: ['websocket'],
  });
  
  socket.on('connect', () => {
    console.log('Socket connected');
  });
  
  socket.on('order:status_update', (data) => {
    useOrdersStore.getState().updateOrderStatus(data.order_id, data.status);
  });
  
  socket.on('key:activated', (data) => {
    useKeyStore.getState().setKeyActive(data);
  });
  
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
\`\`\`

## STEP 3 — MenuScreen.tsx
Layout:
\`\`\`
┌─────────────────────────────────────┐
│  🍽 Room Service                    │  ← header
│  🕐 Kitchen open until 11 PM        │
├─────────────────────────────────────┤
│  Suggested for you                  │  ← AI recommendations (horizontal scroll)
│  ┌────┐  ┌────┐  ┌────┐            │
│  │img │  │img │  │img │            │
│  │Dosa│  │Curry│  │Coffee│          │
│  └────┘  └────┘  └────┘            │
├─────────────────────────────────────┤
│ [All] [Breakfast] [Mains] [Drinks]  │  ← category tabs
├─────────────────────────────────────┤
│  ┌──────────────────────────────┐  │
│  │ 🥗 Masala Dosa               │  │  ← menu item card
│  │ Crispy crepe with potato...   │  │
│  │ ⏱ 15 min  🌿 Veg  ₹280      │  │
│  │                    [ + Add ]  │  │
│  └──────────────────────────────┘  │
│  [Cart (2 items) · ₹580 · View →]  │  ← sticky cart bar
└─────────────────────────────────────┘
\`\`\`

Implementation:
- FlatList for menu items (performance for large menus)
- Category tabs: ScrollView horizontal with tab indicator
- AI recommendations: horizontal FlatList at top (calls GET /menu?recommended=true)
- Dietary badges: coloured pills (🌿 Veg, 🌱 Vegan, GF, Halal)
- "Add" button: first tap adds to cart, subsequent taps show +/- quantity stepper
- Sticky bottom bar: appears when cart has items

### Item detail bottom sheet (when user taps a menu item):
\`\`\`
┌─────────────────────────────────────┐
│  [Image]                            │
│  Masala Dosa                ₹280   │
│  Crispy rice flour crepe with...    │
│  Allergens: None  ·  🌿 Vegetarian  │
│  ─────────────────────────────────  │
│  Special instructions (optional)    │
│  ┌─────────────────────────────┐   │
│  │ e.g. Extra sambar please    │   │
│  └─────────────────────────────┘   │
│  Quantity:  [ - ]  2  [ + ]        │
│  [ Add to cart  ·  ₹560 ]          │
└─────────────────────────────────────┘
\`\`\`

## STEP 4 — CartScreen.tsx
\`\`\`
┌─────────────────────────────────────┐
│  Your order                         │
├─────────────────────────────────────┤
│  Masala Dosa × 2  ₹560             │
│  [ edit notes ]    [ - ]  2  [ + ]  │
│  Filter Coffee × 2  ₹240           │
│  [ edit notes ]    [ - ]  2  [ + ]  │
├─────────────────────────────────────┤
│  Delivery time:                     │
│  [● ASAP] [ Schedule ]             │
│                                     │
│  Order notes (optional):            │
│  ┌─────────────────────────────┐   │
│  │ e.g. Please knock loudly    │   │
│  └─────────────────────────────┘   │
├─────────────────────────────────────┤
│  Subtotal         ₹800             │
│  Service charge   ₹40              │
│  ────────────────────────────────  │
│  Total            ₹840             │
│                                     │
│  Charge to: [● Room folio] [Card]  │
│  [ Place Order ]                    │
└─────────────────────────────────────┘
\`\`\`

Call POST /api/v1/orders on "Place Order". Show loading state.

## STEP 5 — Order confirmation screen
After successful order placement:
\`\`\`
┌─────────────────────────────────────┐
│          ✓ Order placed!            │
│  Order #ORD-2024-00142             │
│  Estimated delivery: 25 minutes     │
│                                     │
│  [● Received] ──── [Kitchen] ──── [Delivery]  │
│                                     │
│  We'll notify you at each step.     │
│  [ Track order ]  [ Back to home ] │
└─────────────────────────────────────┘
\`\`\`

## STEP 6 — ActiveOrdersScreen.tsx (real-time tracking)
\`\`\`
┌─────────────────────────────────────┐
│  Active orders                      │
├─────────────────────────────────────┤
│  Order #142 · Club Sandwich + 2×Coke│
│  ●─────●────────○────────○          │
│  Received  Preparing  Ready  Delivered│
│  Status: PREPARING · ~8 min left   │
│                                     │
│  Assigned: Ravi Kumar               │
│  ────────────────────────────────  │
│  Order #139 · Laundry Pickup       │
│  ●─────────●──────────○────────○   │
│  Requested  Collected  Washing  Ready│
│  Status: COLLECTED                  │
└─────────────────────────────────────┘
\`\`\`

Socket.io handles updates. Animate progress indicators on status change.

## STEP 7 — Post-delivery rating
2 minutes after status = completed:
- Push notification: "How was your Club Sandwich? Tap to rate."
- Or in-app: bottom sheet appears with 5-star tap rating + optional text note

## Acceptance criteria
- Menu loads and renders items with correct dietary badges
- Category tabs filter menu items correctly
- Add to cart button updates cart badge count
- Place order creates order and navigates to confirmation
- Confirmation screen shows correct estimated delivery time
- Status progress bar updates in real time via Socket.io without refresh
- Rating bottom sheet appears 2 minutes after order completed`
},

// ─────────────────────────────────────────────────────────
{ num:'T-13', title:'Guest app — Digital check-in & mobile key', phase:'Phase 1 · Wk 4', effort:'2 days', color:C.purple,
  objective:'Build the digital pre-check-in flow with ID scanning, preferences form, and the mobile room key screen with BLE unlock functionality.',
  dependencies:'T-10, T-11, T-04, T-06',
  outputs:['PreCheckinScreen.tsx — multi-step flow (ID scan → preferences → confirm)','MobileKeyScreen.tsx — key display + BLE unlock button','BLE unlock logic via react-native-ble-plx','ID scan using expo-camera + Google MLKit OCR','Key status polling with visual states (pending/active/revoked)'],
  prompt:`Build the digital check-in and mobile room key screens for Hotel OS.

## Dependencies
\`\`\`bash
cd apps/mobile
pnpm add react-native-ble-plx expo-camera expo-barcode-scanner
npx expo install expo-camera
\`\`\`

## STEP 1 — Pre-checkin flow (src/screens/CheckIn/)
Multi-step wizard with progress indicator: Step 1 (ID scan) → Step 2 (Preferences) → Step 3 (Confirm)

### Step 1 — ID Scan (CheckInStep1Screen.tsx)
\`\`\`
┌─────────────────────────────────────┐
│  Digital Check-in                   │
│  Step 1 of 3 · ● ○ ○               │  ← progress dots
├─────────────────────────────────────┤
│  Scan your ID document              │
│  ┌─────────────────────────────┐   │
│  │  [  📷 Scan Passport  ]     │   │  ← camera button
│  │  [  🪪 Scan Aadhaar   ]     │   │
│  │  [  🚗 Scan Driving Licence ]│   │
│  └─────────────────────────────┘   │
│  ─────────── OR ────────────────── │
│  [ Enter details manually ]        │
└─────────────────────────────────────┘
\`\`\`

Camera flow:
1. Request camera permission (expo-camera)
2. Open camera in full-screen card-scanning mode
3. Capture image
4. Send to ai-service for OCR text extraction:
   POST /ai/ocr { image_base64: string } → { full_name, date_of_birth, document_number_hash }
5. Show extracted data for guest to confirm/edit
6. Hash document number with SHA-256 before storing (never store raw document numbers)

### Step 2 — Preferences (CheckInStep2Screen.tsx)
\`\`\`
┌─────────────────────────────────────┐
│  Your preferences                   │
│  Step 2 of 3 · ● ● ○               │
├─────────────────────────────────────┤
│  Room temperature                   │
│  [16°C ────────●────────── 30°C]   │  ← slider (default 22°C)
│  22°C                               │
│                                     │
│  Pillow type                        │
│  [ Soft ] [ Medium ] [● Firm ]     │  ← segment selector
│                                     │
│  Floor preference                   │
│  [ High ] [● Low ] [ No pref ]     │
│                                     │
│  Dietary preferences                │
│  ☑ Vegetarian  ☐ Vegan  ☐ Halal   │
│  ☐ Gluten-free ☐ No nuts           │
│                                     │
│  Special requests                   │
│  ┌─────────────────────────────┐   │
│  │ Celebrating anniversary...  │   │
│  └─────────────────────────────┘   │
│  [ Next → ]                        │
└─────────────────────────────────────┘
\`\`\`

### Step 3 — Confirm (CheckInStep3Screen.tsx)
Summary of: room assigned, dates, preferences. "Complete check-in" button calls POST /reservations/:id/pre-checkin. Success → mobile key screen.

## STEP 2 — Key store (src/stores/key.store.ts)
\`\`\`typescript
interface KeyState {
  keyData: KeyResponse | null;
  unlockStatus: 'idle' | 'scanning' | 'connecting' | 'unlocking' | 'success' | 'error';
  
  fetchKey: (reservationId: string) => Promise<void>;
  unlockDoor: () => Promise<void>;
}
\`\`\`

## STEP 3 — MobileKeyScreen.tsx
\`\`\`
┌─────────────────────────────────────┐
│  Room 412                           │
│  4th Floor · Deluxe King            │
├─────────────────────────────────────┤
│                                     │
│         ┌──────────┐               │
│         │    🔑    │               │  ← animated key icon
│         │  ROOM    │               │
│         │   412    │               │
│         └──────────┘               │
│                                     │
│  ●  Key active until Nov 17, 12 PM  │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  [    Hold to Unlock 🔓    ]│   │  ← hold button
│  └─────────────────────────────┘   │
│                                     │
│  Stand within 1m of the door lock  │
└─────────────────────────────────────┘
\`\`\`

States:
- Pending: key icon greyed out, "Key activates at check-in" message, unlock button disabled
- Active: key icon gold/animated, hold button enabled
- Unlocking: "Connecting to lock..." with spinner
- Success: checkmark animation + haptic feedback
- Error: "Could not connect. Try again." with retry button

## STEP 4 — BLE unlock logic (src/lib/ble.ts)
\`\`\`typescript
import { BleManager, Device } from 'react-native-ble-plx';
import { atob } from 'react-native-quick-base64';

const bleManager = new BleManager();

const LOCK_SERVICE_UUID = '00001234-0000-1000-8000-00805f9b34fb';   // ASSA ABLOY characteristic
const LOCK_CHAR_UUID    = '00001235-0000-1000-8000-00805f9b34fb';

export async function unlockWithBle(keyToken: string, lockDeviceId: string): Promise<void> {
  // 1. Request BLE permissions (Android 12+ requires BLUETOOTH_SCAN + BLUETOOTH_CONNECT)
  await requestBlePermissions();
  
  // 2. Scan for the specific lock device
  const device = await scanForLock(lockDeviceId);
  
  // 3. Connect to device
  const connected = await device.connect();
  
  // 4. Discover services and characteristics
  await connected.discoverAllServicesAndCharacteristics();
  
  // 5. Write key token to unlock characteristic
  await connected.writeCharacteristicWithResponseForService(
    LOCK_SERVICE_UUID,
    LOCK_CHAR_UUID,
    Buffer.from(keyToken).toString('base64'),
  );
  
  // 6. Disconnect
  await connected.cancelConnection();
}

async function scanForLock(deviceId: string): Promise<Device> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      bleManager.stopDeviceScan();
      reject(new Error('Lock not found within range'));
    }, 10000);
    
    bleManager.startDeviceScan(null, null, (error, device) => {
      if (error) { clearTimeout(timeout); reject(error); return; }
      if (device && (device.id === deviceId || device.name?.includes('HotelLock'))) {
        clearTimeout(timeout);
        bleManager.stopDeviceScan();
        resolve(device);
      }
    });
  });
}
\`\`\`

For development without real locks: Create a MockBleUnlock that simulates 2-second unlock delay and always succeeds.

## STEP 5 — Hold-to-unlock button component
\`\`\`typescript
function HoldToUnlockButton({ onUnlock, disabled }: Props) {
  const holdProgress = useSharedValue(0);
  const HOLD_DURATION = 1500; // ms
  
  const gesture = Gesture.LongPress()
    .minDuration(HOLD_DURATION)
    .onStart(() => {
      holdProgress.value = withTiming(1, { duration: HOLD_DURATION });
    })
    .onEnd(() => {
      onUnlock();
    })
    .onFinalize(() => {
      holdProgress.value = withTiming(0, { duration: 300 });
    });
  
  // Animated fill shows progress during hold
  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.button, { opacity: disabled ? 0.4 : 1 }]}>
        <AnimatedFill progress={holdProgress} />
        <Text style={styles.label}>Hold to Unlock</Text>
      </Animated.View>
    </GestureDetector>
  );
}
\`\`\`

## Acceptance criteria
- Camera opens for ID scan and captured image is processed
- Preferences form saves all selections
- Pre-checkin API call succeeds and navigates to key screen
- Key screen shows pending state before check-in time
- Hold-to-unlock button shows animated progress during hold
- Successful unlock triggers haptic feedback + visual confirmation
- BLE scan shows "not found" error gracefully after 10 second timeout`
},

// ─────────────────────────────────────────────────────────
{ num:'T-14', title:'Guest app — AI concierge chat', phase:'Phase 1 · Wk 4', effort:'2 days', color:C.amber,
  objective:'Build the 24/7 AI concierge chat screen with a WhatsApp-style interface, real-time typing indicators via Socket.io, action confirmation cards for auto-created orders, and human escalation.',
  dependencies:'T-10, T-11, T-07',
  outputs:['ConciergeScreen.tsx — full chat UI','useConciergeStore (Zustand) — conversation history + session management','Typing indicator component','Action confirmation card (when concierge creates an order)','Quick reply suggestions','Human escalation flow'],
  prompt:`Build the AI concierge chat screen for Hotel OS.

## STEP 1 — Concierge store (src/stores/concierge.store.ts)
\`\`\`typescript
interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  actions?: Action[];
  isTyping?: boolean;
}

interface Action {
  type: 'order_created' | 'service_requested' | 'human_escalation';
  data: Record<string, any>;
}

interface ConciergeState {
  messages: Message[];
  sessionId: string;
  isTyping: boolean;
  needsHuman: boolean;
  
  sendMessage: (text: string, reservationId: string, guestProfile: object) => Promise<void>;
  requestHuman: (reservationId: string) => Promise<void>;
  clearConversation: () => void;
}
\`\`\`

sendMessage implementation:
1. Add user message to messages array
2. Set isTyping = true (shows typing indicator)
3. Call POST /api/v1/concierge/message with message, session_id, reservation_id, conversation history (last 10 messages)
4. Set isTyping = false
5. Add assistant message with response_text and actions

## STEP 2 — ConciergeScreen.tsx

\`\`\`
┌─────────────────────────────────────┐
│  ← AI Concierge                     │  ← header with back + hotel name
│  Hotel Grand Chennai · Online       │
├─────────────────────────────────────┤
│                                     │
│  Welcome to Hotel Grand Chennai!    │  ← initial message (assistant bubble)
│  I can help with:                   │
│  🍽 Food orders  🧹 Housekeeping    │
│  👔 Laundry  📍 Local recommendations│
│                                     │
│  [Order food] [Local tips] [Checkout time]│  ← quick reply chips
│                                     │
│                    Can I get a      │  ← user bubble (right-aligned)
│                 club sandwich?      │
│                                     │
│  ● ● ●  (typing indicator)         │  ← assistant typing
│                                     │
│  Of course! I've placed your order: │  ← assistant bubble
│  ┌────────────────────────────┐    │
│  │ ✓ Order placed             │    │  ← action confirmation card
│  │ Club Sandwich · ₹420       │    │
│  │ ETA: ~20 minutes           │    │
│  │ [ Track order ]            │    │
│  └────────────────────────────┘    │
│                                     │
│  Is there anything else I can      │
│  help you with?                     │
│                                     │
│  [Track order] [Add dessert] [Checkout?]│
├─────────────────────────────────────┤
│  ┌─────────────────────────┐ [↑]  │  ← text input
│  │ Type a message...       │      │
│  └─────────────────────────┘      │
└─────────────────────────────────────┘
\`\`\`

## STEP 3 — Message bubble component (src/components/MessageBubble.tsx)
\`\`\`typescript
function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  
  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.assistantContainer]}>
      {!isUser && (
        <View style={styles.avatar}>
          <Text>🤖</Text>
        </View>
      )}
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        <Text style={isUser ? styles.userText : styles.assistantText}>
          {message.content}
        </Text>
        {message.actions?.map(action => (
          <ActionCard key={action.type} action={action} />
        ))}
        <Text style={styles.timestamp}>
          {format(message.timestamp, 'HH:mm')}
        </Text>
      </View>
    </View>
  );
}
\`\`\`

User bubbles: right-aligned, teal background (#0F6E56), white text
Assistant bubbles: left-aligned, light grey (#F4F6FA), navy text
Timestamps: 10px, muted, below content

## STEP 4 — Typing indicator component
\`\`\`typescript
function TypingIndicator() {
  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);
  
  useEffect(() => {
    // Staggered bounce animation for 3 dots
    dot1.value = withRepeat(withSequence(withTiming(-6, {duration: 400}), withTiming(0, {duration: 400})), -1);
    setTimeout(() => { dot2.value = withRepeat(withSequence(withTiming(-6, {duration: 400}), withTiming(0, {duration: 400})), -1); }, 133);
    setTimeout(() => { dot3.value = withRepeat(withSequence(withTiming(-6, {duration: 400}), withTiming(0, {duration: 400})), -1); }, 266);
  }, []);
  
  return (
    <View style={styles.typingBubble}>
      <Animated.View style={[styles.dot, { transform: [{ translateY: dot1 }] }]} />
      <Animated.View style={[styles.dot, { transform: [{ translateY: dot2 }] }]} />
      <Animated.View style={[styles.dot, { transform: [{ translateY: dot3 }] }]} />
    </View>
  );
}
\`\`\`

## STEP 5 — Action confirmation card (src/components/ActionCard.tsx)
When the AI creates an order, show this inline card:
\`\`\`
┌─────────────────────────────────┐
│ ✓ Order placed                  │
│ Club Sandwich × 1  ₹420        │
│ Filter Coffee × 2  ₹240        │
│ Total: ₹660 · ETA: ~20 min     │
│ [ Track this order →  ]        │
└─────────────────────────────────┘
\`\`\`
Tapping "Track this order" navigates to ActiveOrders screen.

## STEP 6 — Quick reply suggestions
After each assistant message, show up to 3 suggestion chips:
- Tapping a chip sends it as a new message
- Chips disappear after user sends any message (replaced by new ones from next response)

## STEP 7 — Human escalation
\`\`\`
┌─────────────────────────────────────┐
│  Connect with our team              │
│                                     │
│  Our team will continue this chat.  │
│  They can see your conversation.    │
│                                     │
│  [ Connect to staff ]               │
│  [ Continue with AI ]               │
└─────────────────────────────────────┘
\`\`\`

When concierge response has needs_human: true, or user types "speak to someone", show escalation prompt.
POST /api/v1/crm/conversations/:id/takeover → staff receives push notification with chat context.

## Acceptance criteria
- Sending a message shows user bubble immediately (optimistic UI)
- Typing indicator shows within 500ms of sending message
- Typing indicator replaced by response within 3 seconds (P95)
- Order action card shows correctly when AI creates an order
- Tapping action card navigates to correct screen
- Quick replies are tappable and send as messages
- Human escalation flow shows correctly and notifies staff
- Conversation history persists across app close/reopen within same stay`
},

// ─────────────────────────────────────────────────────────
{ num:'T-15', title:'Staff app — Task queue & guest intelligence', phase:'Phase 1 · Wk 4', effort:'2 days', color:C.coral,
  objective:'Build the staff-facing screens: the real-time task queue with SLA countdowns, task status update flow, guest intelligence panel with AI brief, and push notification handling.',
  dependencies:'T-10, T-05, T-07',
  outputs:['StaffTaskQueueScreen.tsx — live task list with SLA timers','StaffTaskDetailScreen.tsx — task detail + status update actions','GuestIntelligenceScreen.tsx — guest profile + AI brief','StaffNavigator.tsx — separate navigation for staff role','useStaffStore (Zustand) — tasks + Socket.io updates','FCM push notification handler for new tasks'],
  prompt:`Build the staff app screens for Hotel OS. The staff app uses the same React Native codebase as the guest app but shows completely different screens based on the user's role.

## STEP 1 — Role-based routing (update src/navigation/RootNavigator.tsx)
\`\`\`typescript
export function RootNavigator() {
  const { isAuthenticated, guest, staffUser } = useAuthStore();
  
  if (!isAuthenticated) return <AuthNavigator />;
  if (staffUser?.userType === 'staff') return <StaffNavigator />;
  return <GuestNavigator />;
}
\`\`\`

Staff login uses POST /auth/staff/login (email + password) instead of OTP.
Add staff login screen to AuthNavigator.

## STEP 2 — Staff store (src/stores/staff.store.ts)
\`\`\`typescript
interface Task {
  id: string;
  type: string;
  status: string;
  priority: 'high' | 'medium' | 'low';
  guest: { name: string; roomNumber: string; loyaltyTier: string };
  description: string;
  totalAmount?: number;
  createdAt: string;
  slaDeadline: string;
  slaMinutesRemaining: number;
  isSlaBreached: boolean;
  assignedToMe: boolean;
}

interface StaffState {
  tasks: Task[];
  guestProfiles: Record<string, GuestProfile>;
  isLoading: boolean;
  
  fetchTasks: (filter?: { status?: string; type?: string }) => Promise<void>;
  updateTaskStatus: (taskId: string, status: string, notes?: string, photoUrl?: string) => Promise<void>;
  fetchGuestProfile: (guestId: string) => Promise<GuestProfile>;
  updateTaskLocal: (taskId: string, updates: Partial<Task>) => void; // for Socket.io
}
\`\`\`

## STEP 3 — StaffNavigator.tsx (bottom tabs for staff)
Tabs:
- Tasks (main tab) — task queue
- Guests — searchable guest list
- Floor — housekeeping floor map (Phase 2)
- Alerts — manager view only

## STEP 4 — StaffTaskQueueScreen.tsx
\`\`\`
┌─────────────────────────────────────┐
│  Task Queue · 4 pending             │  ← header with count
│  [All] [Mine] [Food] [Housekeeping] │  ← filter pills
├─────────────────────────────────────┤
│  ┌─────────────────────────────┐   │
│  │ 🍽 FOOD  ●  Room 412        │   │  ← red dot = SLA warning
│  │ Club Sandwich + 2×Coke      │   │
│  │ Priya Mehta · 🏆 GOLD       │   │  ← tier badge
│  │ Received 4 min ago          │   │
│  │ SLA: 26 min remaining ⏰    │   │  ← countdown timer (live)
│  │ [ Accept ]   [ Reassign ]   │   │  ← action buttons
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ 🧹 HOUSEKEEPING  Room 208   │   │
│  │ Make up room request        │   │
│  │ Standard guest              │   │
│  │ Received 12 min ago         │   │
│  │ SLA: 18 min remaining       │   │
│  │ [ Accept ]   [ Reassign ]   │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
\`\`\`

Implementation:
- FlatList with task cards
- Live SLA countdown: use setInterval every second to recalculate slaMinutesRemaining
- Red border on task card when slaMinutesRemaining < 10
- "Accept" button calls PATCH /staff/tasks/:id/status with status: accepted
- Socket.io: listen to task:new → prepend to tasks list, animate entrance
- Socket.io: listen to task:sla_warning → update task urgency indicator

## STEP 5 — StaffTaskDetailScreen.tsx
Full task detail:
- Guest name, room, tier badge, phone number (tap to call)
- Order items (if food/beverage) with individual notes
- SLA countdown
- Status update buttons: Accept → In Progress → Complete
- "Add note" text input
- For housekeeping completion: camera button to take completion photo
- "View guest profile" button

## STEP 6 — Photo completion flow
For housekeeping tasks, completion requires photo:
\`\`\`typescript
async function completeWithPhoto(taskId: string) {
  // Open camera
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.5,
    allowsEditing: false,
  });
  
  if (!result.canceled) {
    // Upload to S3 via presigned URL
    const { presignedUrl, fileUrl } = await api.get('/media/presign?type=task-photo');
    await fetch(presignedUrl, {
      method: 'PUT',
      body: { uri: result.assets[0].uri, type: 'image/jpeg' },
    });
    
    // Complete task with photo URL
    await updateTaskStatus(taskId, 'completed', undefined, fileUrl);
  }
}
\`\`\`

## STEP 7 — GuestIntelligenceScreen.tsx
\`\`\`
┌─────────────────────────────────────┐
│  ← Priya Mehta                      │
│  🏆 GOLD · 8 stays · ₹2.4L LTV     │
├─────────────────────────────────────┤
│  AI Brief                           │  ← calls /ai/guest-brief on load
│  ┌─────────────────────────────┐   │
│  │ Priya is a Gold member on   │   │
│  │ her 8th stay. She prefers   │   │
│  │ high-floor quiet rooms and  │   │
│  │ vegetarian meals...         │   │
│  └─────────────────────────────┘   │
├─────────────────────────────────────┤
│  Current stay                       │
│  Room 412 · Nov 15–17               │
│  Balance due: ₹8,340                │
├─────────────────────────────────────┤
│  Active orders (2)                  │
│  ● Club Sandwich · Preparing        │
│  ● Laundry · Collected             │
├─────────────────────────────────────┤
│  Preferences                        │
│  🌿 Vegetarian  🌡 22°C  🛏 Firm   │
│  📰 Times of India  🏢 High floor  │
├─────────────────────────────────────┤
│  Recent feedback                    │
│  ⭐⭐⭐⭐⭐ F&B team was amazing    │
│  ⭐⭐⭐⭐ Room was clean and quiet   │
└─────────────────────────────────────┘
\`\`\`

## STEP 8 — FCM push notification handling
\`\`\`typescript
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Handle notification taps
Notifications.addNotificationResponseReceivedListener(response => {
  const { type, taskId } = response.notification.request.content.data as any;
  
  if (type === 'new_task') {
    navigation.navigate('StaffTaskDetail', { taskId });
  } else if (type === 'sla_warning') {
    navigation.navigate('StaffTaskDetail', { taskId });
  } else if (type === 'negative_feedback') {
    navigation.navigate('GuestIntelligence', { guestId: response.notification.request.content.data.guestId });
  }
});
\`\`\`

## Acceptance criteria
- Task queue shows all pending tasks sorted by SLA (soonest first)
- SLA countdown updates every second without re-fetching from API
- Red border appears on task with < 10 minutes SLA remaining
- Accept button updates task status immediately (optimistic UI) and confirms with server
- New task pushed via Socket.io appears at top of queue with entrance animation
- Guest intelligence screen loads AI brief within 5 seconds
- Photo completion prompts camera and uploads before marking complete`
},

// ─────────────────────────────────────────────────────────
{ num:'T-16', title:'Guest app — Loyalty, feedback & account screens', phase:'Phase 1/2 · Wk 4-5', effort:'2 days', color:C.green,
  objective:'Build the loyalty programme UI, emotion-aware feedback system, and account/profile screens. Completes the full guest app feature set for Phase 1.',
  dependencies:'T-10, T-11, T-09',
  outputs:['LoyaltyScreen.tsx — points balance, tier progress, challenges, statement','FeedbackScreen.tsx — emotion-aware rating with mood picker, voice note','AccountScreen.tsx — profile, preferences, past stays','CheckoutFeedbackModal.tsx — shown on checkout completion'],
  prompt:`Build the loyalty, feedback, and account screens for Hotel OS.

## STEP 1 — LoyaltyScreen.tsx
\`\`\`
┌─────────────────────────────────────┐
│  My Rewards                         │
├─────────────────────────────────────┤
│  ┌─────────────────────────────┐   │
│  │  🏆 GOLD MEMBER             │   │  ← tier card with gradient bg
│  │  4,820 points               │   │
│  │  ≈ ₹482 value               │   │
│  │                             │   │
│  │  ████████████░░░  82%       │   │  ← progress to Platinum
│  │  2,600 pts to Platinum      │   │
│  └─────────────────────────────┘   │
├─────────────────────────────────────┤
│  This stay earned: +148 pts        │
│  Expiring soon: 500 pts (Jan 31)   │
├─────────────────────────────────────┤
│  Benefits                           │
│  ✓ Late checkout request           │
│  ✓ Priority room service           │
│  ✓ Room upgrade request            │
├─────────────────────────────────────┤
│  Challenges 🎮                      │
│  ┌────────┐  ┌────────┐            │
│  │ 🍽  3/5│  │ 📱  ✓  │            │  ← gamification badges
│  │ Foodie │  │App Login│            │
│  └────────┘  └────────┘            │
├─────────────────────────────────────┤
│  Transaction history               │
│  +148 Stay earnings · Nov 17       │
│  -500 Redeemed · Nov 16            │
│  +100 Review bonus · Oct 29        │
│  [ Load more ]                     │
└─────────────────────────────────────┘
\`\`\`

Tier progress bar: Animated.View with width proportional to tier_progress_pct. Use teal fill colour.

Challenge cards: Show completion state with checkmark + greyed out background when complete.

## STEP 2 — FeedbackScreen.tsx (Emotion-aware)
\`\`\`
┌─────────────────────────────────────┐
│  How was your stay?                 │
│  The Grand Chennai · Nov 15–17      │
├─────────────────────────────────────┤
│  Overall experience                 │
│                                     │
│   😢    😕    😐    🙂    😍        │
│                         ●           │  ← selected: happy
│   Very   Unhappy  OK  Happy  Loved  │
│  unhappy                    it!     │
│                                     │
├─────────────────────────────────────┤
│  Rate specific areas:              │
│  Food & Beverage    ⭐ ⭐ ⭐ ⭐ ⭐   │
│  Housekeeping       ⭐ ⭐ ⭐ ⭐ ☆   │
│  Front Desk         ⭐ ⭐ ⭐ ⭐ ⭐   │
│  Concierge          ⭐ ⭐ ⭐ ⭐ ⭐   │
├─────────────────────────────────────┤
│  Tell us more (optional)            │
│  ┌─────────────────────────────┐   │
│  │ The staff were so helpful...│   │
│  └─────────────────────────────┘   │
│  [ 🎤 Record voice note (0:00) ]   │  ← voice note button
├─────────────────────────────────────┤
│  [ Submit ]                         │
└─────────────────────────────────────┘
\`\`\`

Mood picker:
- 5 emoji buttons in a row
- Selected emoji scales up (1.3x) with spring animation
- Teal underline indicator slides to selected position

Voice note:
- Tap microphone to start recording (expo-av)
- Live waveform or timer showing recording duration
- Max 60 seconds, auto-stop at limit
- Play back before submitting

After submit:
- Score 4–5: show "Share on Google?" modal with direct Google Maps review link
- Score 1–2: show "We're sorry" message + connect to manager CTA
- All: show loyalty points earned (+100 for review)

## STEP 3 — AccountScreen.tsx
Sections:
- Profile: name, email, phone (read-only), language setting
- Preferences: dietary flags, room temp, pillow type (links to PreferencesEditScreen)
- Loyalty: tier badge + points (links to LoyaltyScreen)
- Payment methods: show saved cards / UPI (links to payment screen)
- Past stays: last 5 stays with date, property, nights, spend
- Help & Support: FAQ link, contact us CTA
- Logout button (with confirmation dialog)

## STEP 4 — CheckoutFeedbackModal.tsx
Shown automatically after successful express checkout:
\`\`\`
┌─────────────────────────────────────┐
│  Stay complete!                     │
│                                     │
│  You earned 148 points this stay.  │
│  New balance: 4,968 points          │
│                                     │
│  [ ⭐ Rate your stay ]              │
│  [ 📄 Download invoice ]            │
│  [ 🏠 Back to home ]               │
└─────────────────────────────────────┘
\`\`\`

## Acceptance criteria
- Tier progress bar animates to correct width on mount
- Mood picker selection animates smoothly
- Category star ratings are independently selectable
- Voice note records and plays back correctly
- Feedback submission calls POST /feedback with all fields
- Rating 4+ shows Google review redirect
- Rating 1–2 shows manager contact option
- Checkout modal appears automatically after checkout
- Account screen shows correct profile data`
},

// ─────────────────────────────────────────────────────────
{ num:'T-17', title:'Web dashboard — Next.js scaffold & overview', phase:'Phase 2 · Wk 5', effort:'2 days', color:C.navy,
  objective:'Build the web management dashboard with Next.js 14 App Router: authentication, layout, and the live overview module showing real-time occupancy, revenue, arrivals, and KPIs.',
  dependencies:'T-01, T-03, T-04, T-05',
  outputs:['apps/web/ — complete Next.js 14 App Router scaffold','Staff authentication (NextAuth.js)','Dashboard layout: sidebar + topbar + main content area','OverviewPage.tsx — live KPI cards, occupancy heatmap preview, today\'s arrivals list','Real-time updates via Socket.io client and SWR polling'],
  prompt:`Build the Hotel OS web management dashboard with Next.js 14.

## Setup
\`\`\`bash
cd apps/web
npx create-next-app . --typescript --tailwind --app --src-dir --import-alias "@/*"
pnpm add next-auth@beta recharts socket.io-client swr axios zod
pnpm add @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-select
pnpm add lucide-react date-fns class-variance-authority clsx tailwind-merge
\`\`\`

## Design system
Use Tailwind with these custom colours in tailwind.config.ts:
\`\`\`javascript
colors: {
  navy: { DEFAULT: '#1B2A4A', light: '#2A3F6A' },
  teal: { DEFAULT: '#0F6E56', light: '#E1F5EE', border: '#5DCAA5' },
  amber: { DEFAULT: '#854F0B', light: '#FAEEDA' },
}
\`\`\`

## STEP 1 — Auth with NextAuth.js (src/auth.ts)
Configure NextAuth with Credentials provider calling the auth-service staff login endpoint:
\`\`\`typescript
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        totp_code: { label: "2FA Code", type: "text" },
      },
      authorize: async (credentials) => {
        const response = await fetch(\`\${process.env.AUTH_SERVICE_URL}/api/v1/auth/staff/login\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credentials),
        });
        if (!response.ok) return null;
        const data = await response.json();
        return {
          id: data.staff.id,
          email: data.staff.email,
          name: data.staff.fullName,
          role: data.staff.role,
          accessToken: data.access_token,
          propertyId: data.staff.propertyId,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) { token.accessToken = user.accessToken; token.role = user.role; token.propertyId = user.propertyId; }
      return token;
    },
    session({ session, token }) {
      session.user.accessToken = token.accessToken as string;
      session.user.role = token.role as string;
      session.user.propertyId = token.propertyId as string;
      return session;
    },
  },
  pages: { signIn: '/login' },
});
\`\`\`

## STEP 2 — Dashboard layout (src/app/(dashboard)/layout.tsx)
\`\`\`
┌────────────────────────────────────────────────────────┐
│  ≡  Hotel OS             Priya (Manager) · logout      │  ← topbar
├──────────────┬─────────────────────────────────────────┤
│              │                                         │
│  📊 Overview │  [  main content area  ]               │
│  📋 Tasks    │                                         │
│  👥 Guests   │                                         │
│  🛏 Rooms    │                                         │
│  📈 Reports  │                                         │
│  💬 CRM      │                                         │
│  ⚙ Settings │                                         │
│              │                                         │
└──────────────┴─────────────────────────────────────────┘
\`\`\`

Sidebar: fixed width 240px on desktop. Collapses to icon-only on tablet.
Active link: teal left border + teal text.
Role-based visibility: CRM tab only for manager+.

## STEP 3 — Overview page (src/app/(dashboard)/overview/page.tsx)

### KPI cards row
\`\`\`
┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐
│ Occupancy  │ │ In-house   │ │ Revenue    │ │ RevPAR     │
│   87%      │ │  142       │ │ ₹2.4L      │ │ ₹5,220     │
│ +4% vs yday│ │ 23 arriving│ │ +12% WoW  │ │ +8% WoW    │
└────────────┘ └────────────┘ └────────────┘ └────────────┘
\`\`\`

Each card:
- Large metric value (28px bold)
- Metric name (12px muted)
- Change indicator: green arrow up / red arrow down + % change vs yesterday/last week

Fetch from GET /api/v1/analytics/overview?date=today. Refresh every 60 seconds via SWR:
\`\`\`typescript
const { data } = useSWR('/api/v1/analytics/overview', fetcher, { refreshInterval: 60000 });
\`\`\`

### Today's arrivals/departures
Two columns side by side:
- Arriving today (date = today, status = confirmed)
- Departing today (date = today, status = checked_in)

Each row: Guest name + room number + tier badge + status pill + "View profile" link.

### Pending tasks summary
\`\`\`
Tasks overview · 6 pending
─────────────────────────
Food & Bev:    ████  4  (2 SLA warning ⚠)
Housekeeping:  ██    1
Laundry:       ██    1
\`\`\`

Links to full task queue page.

### Live order queue (last 5 orders)
Compact table: Order ID | Guest | Room | Type | Status | Time | SLA

## STEP 4 — API client for dashboard (src/lib/api.ts)
\`\`\`typescript
import { getSession } from 'next-auth/react';

export async function dashboardFetch(url: string, options?: RequestInit) {
  const session = await getSession();
  return fetch(\`\${process.env.NEXT_PUBLIC_API_URL}\${url}\`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: \`Bearer \${session?.user?.accessToken}\`,
      ...options?.headers,
    },
  });
}

export const fetcher = (url: string) => dashboardFetch(url).then(r => r.json());
\`\`\`

## STEP 5 — Socket.io for real-time (src/lib/socket.ts)
Connect to orders-service Socket.io from dashboard:
\`\`\`typescript
const socket = io(process.env.NEXT_PUBLIC_ORDERS_WS_URL, {
  auth: { token: session.accessToken },
});

socket.on('task:new', (task) => {
  // Show toast notification
  toast(\`New task: \${task.type} - Room \${task.guest.roomNumber}\`);
  // Refresh task count
  mutate('/api/v1/staff/tasks/summary');
});
\`\`\`

## Acceptance criteria
- Staff can log in with email + password
- Incorrect credentials show error message
- Overview page loads and shows correct KPI values
- KPI cards auto-refresh every 60 seconds
- Arrivals list shows today's guests correctly
- Real-time toast appears when new task created
- Sidebar navigation works and highlights active page
- Unauthenticated access redirects to /login`
},

// ─────────────────────────────────────────────────────────
{ num:'T-18', title:'Web dashboard — Analytics, guest list & CRM inbox', phase:'Phase 2 · Wk 6', effort:'2 days', color:C.navy,
  objective:'Build the remaining dashboard modules: revenue analytics with Recharts charts, full guest list with search and filters, staff performance table, and the CRM conversation inbox.',
  dependencies:'T-17',
  outputs:['RevenueAnalyticsPage.tsx — revenue charts by segment with date range','GuestListPage.tsx — searchable sortable table with filters','GuestDetailPanel.tsx — 360° guest view with AI brief','StaffPerformancePage.tsx — task metrics per staff member','CrmInboxPage.tsx — conversation list (connects to CRM product later)'],
  prompt:`Build the analytics and data pages for the Hotel OS web dashboard.

## STEP 1 — Revenue analytics page (src/app/(dashboard)/analytics/page.tsx)

### Date range selector
Date range picker (from/to) with presets: Today, This Week, This Month, Last Month, Custom.

### Revenue by segment chart
\`\`\`typescript
// Recharts stacked bar chart
<BarChart data={revenueData}>
  <Bar dataKey="room" name="Room" fill="#0F6E56" stackId="a" />
  <Bar dataKey="fnb" name="Food & Bev" fill="#BA7517" stackId="a" />
  <Bar dataKey="other" name="Other" fill="#534AB7" stackId="a" />
  <XAxis dataKey="date" />
  <YAxis tickFormatter={(v) => \`₹\${(v/1000).toFixed(0)}K\`} />
  <Tooltip formatter={(v) => \`₹\${Number(v).toLocaleString('en-IN')}\`} />
  <Legend />
</BarChart>
\`\`\`

### KPI summary cards
RevPAR, ADR, Occupancy %, Total revenue — with % change vs same period.

### Source breakdown
OTA vs direct booking pie chart. Show OTA commission cost: "Commission paid to OTAs: ₹24,000 this month".

## STEP 2 — Guest list page (src/app/(dashboard)/guests/page.tsx)

TanStack Table with:
- Server-side pagination (20 per page)
- Search: debounced 300ms search by name / phone
- Filters: tier (multi-select), sentiment (high/medium/low), checkout date (range)
- Sort: by name, tier, sentiment, total revenue, last stay
- Export to CSV button

Columns:
| Guest | Tier | Stays | Total Spend | Last Stay | Sentiment | Actions |
| Priya Mehta | 🏆 GOLD | 8 | ₹2.4L | Nov 17 | 😊 0.87 | View |

Tier badges:
- Bronze: grey pill
- Silver: light grey pill
- Gold: amber pill
- Platinum: purple pill

Sentiment score display: emoji face based on score ranges + numeric value.
- 0.0–0.3: 😢 red
- 0.3–0.6: 😐 amber
- 0.6–1.0: 😊 green

## STEP 3 — Guest detail slide-over panel
Clicking any guest row opens a slide-over panel (Radix Dialog) from the right:

\`\`\`
┌──────────────────────────────────┐
│  Priya Mehta                   ✕ │
│  +91 98765 43210                 │
│  🏆 GOLD · 8 stays · LTV ₹2.4L  │
├──────────────────────────────────┤
│  AI Brief                        │  ← calls /ai/guest-brief
│  Priya is a loyal Gold member... │
├──────────────────────────────────┤
│  Current stay                    │
│  Room 412 · Nov 15–17           │
│  Balance: ₹8,340                 │
├──────────────────────────────────┤
│  Preferences                     │
│  🌿 Vegetarian  🌡 22°C  🏢 High │
├──────────────────────────────────┤
│  Past stays                      │
│  Oct 2024  ·  2 nights  ·  ₹18K │
│  Aug 2024  ·  3 nights  ·  ₹28K │
├──────────────────────────────────┤
│  Recent feedback                 │
│  ⭐⭐⭐⭐⭐ "Amazing stay"         │
│  ⭐⭐⭐⭐ "Room was clean"         │
└──────────────────────────────────┘
\`\`\`

## STEP 4 — Staff performance page
Table with per-staff metrics:

| Staff Name | Role | Tasks Done | Avg Rating | SLA Compliance | Breaches |
| Ravi Kumar | Room Service | 42 | 4.7 ⭐ | 94% | 3 |

Fetch from GET /api/v1/analytics/staff/performance?from=&to=

Highlight top performer with 🏆 badge.
Highlight SLA compliance < 80% with red text.

## STEP 5 — Order analytics page
- Order volume by type over time (line chart)
- Average rating per order type (horizontal bar chart)
- SLA compliance % per type
- Peak order times heatmap (hours × days of week grid)

## STEP 6 — CRM inbox page (stub for CRM product)
Show a placeholder page:
\`\`\`
┌────────────────────────────────────────┐
│  WhatsApp CRM Inbox                    │
│                                        │
│  ⚡ CRM module coming in Phase 3       │
│                                        │
│  The AI WhatsApp CRM will manage all  │
│  guest conversations, automated        │
│  journeys, and remarketing campaigns. │
│                                        │
│  Guest conversations from the app      │
│  concierge are shown below:            │
│                                        │
│  [ Priya Mehta · Room 412 · Active ]  │
│  [ Arjun Shah · Room 305 · Resolved ] │
└────────────────────────────────────────┘
\`\`\`

## Acceptance criteria
- Revenue chart renders correctly with mock data
- Date range change triggers data refetch
- Guest list shows 20 per page with correct pagination
- Search debounces and filters results correctly
- Guest detail panel opens without page navigation
- AI brief loads in panel within 5 seconds
- Staff performance table shows correct metrics
- All charts are responsive and render on tablet viewport`
},

// ─────────────────────────────────────────────────────────
{ num:'T-19', title:'Integration testing & seed data', phase:'Phase 1 · Wk 5', effort:'1 day', color:C.muted,
  objective:'Write end-to-end integration tests for all critical user flows, create comprehensive seed data for a realistic demo environment, and validate the complete system works together.',
  dependencies:'T-01 through T-18',
  outputs:['scripts/seed-demo.ts — full demo environment setup','E2E tests: guest login → order food → track → checkout','Integration test: booking.checked_in → key provisioned','Integration test: order placed → staff notified → completed → folio updated','Load test script: 100 concurrent guests','Postman collection for all API endpoints'],
  prompt:`Create integration tests and comprehensive seed data for Hotel OS.

## STEP 1 — Comprehensive seed script (scripts/seed-demo.ts)
Create a full demo environment with realistic data:

\`\`\`typescript
async function seedDemoEnvironment() {
  const prisma = new PrismaClient();
  
  // 1. Create demo property
  const property = await prisma.property.upsert({
    where: { slug: 'grand-chennai-demo' },
    update: {},
    create: {
      name: 'The Grand Chennai',
      slug: 'grand-chennai-demo',
      address: '15 Anna Salai, Chennai',
      city: 'Chennai',
      country: 'IN',
      pmsType: 'manual',
      loyaltyEarnRate: 1.0,
      subscriptionTier: 'growth',
    },
  });

  // 2. Create 30 rooms across 5 floors
  const roomTypes = [
    { type: 'Standard Twin', baseRate: 4500, maxOccupancy: 2 },
    { type: 'Deluxe King', baseRate: 6500, maxOccupancy: 2 },
    { type: 'Premium Suite', baseRate: 12000, maxOccupancy: 4 },
  ];
  // Create rooms 101–130 with mix of types
  
  // 3. Create staff: 1 manager, 2 front_desk, 3 housekeeping, 2 room_service
  const manager = await prisma.staff.create({
    data: {
      propertyId: property.id,
      email: 'manager@grandchennai.com',
      fullName: 'Suresh Iyer',
      role: 'manager',
      passwordHash: await bcrypt.hash('demo1234', 10),
      isActive: true,
    },
  });
  // Create remaining staff...
  
  // 4. Create 50 menu items across categories
  const menuItems = [
    // BREAKFAST
    { name: 'Masala Dosa', description: 'Crispy rice crepe with spiced potato filling, sambar and chutney', price: 280, category: 'breakfast', dietaryTags: ['vegetarian', 'gluten-free'], prepTimeMinutes: 12 },
    { name: 'Idli Sambar (4 pcs)', description: 'Steamed rice cakes with lentil soup and coconut chutney', price: 220, category: 'breakfast', dietaryTags: ['vegetarian', 'gluten-free'], prepTimeMinutes: 8 },
    { name: 'English Breakfast', description: 'Eggs (any style), toast, beans, grilled tomato, mushrooms', price: 480, category: 'breakfast', dietaryTags: [], allergens: ['gluten', 'eggs'], prepTimeMinutes: 18 },
    { name: 'Oats Porridge', description: 'Creamy oats with fresh fruits, honey and nuts', price: 180, category: 'breakfast', dietaryTags: ['vegetarian', 'vegan'], allergens: ['gluten'], prepTimeMinutes: 8 },
    // MAINS (add 10 more items)
    { name: 'Club Sandwich', description: 'Triple-decker with grilled chicken, bacon, egg, lettuce, tomato', price: 420, category: 'mains', dietaryTags: [], allergens: ['gluten', 'eggs'], prepTimeMinutes: 20 },
    { name: 'Paneer Butter Masala', description: 'Cottage cheese in rich tomato-butter gravy, served with naan', price: 380, category: 'mains', dietaryTags: ['vegetarian'], allergens: ['dairy', 'gluten'], prepTimeMinutes: 22 },
    // BEVERAGES
    { name: 'Filter Coffee', description: 'South Indian decoction coffee with milk', price: 120, category: 'beverages', dietaryTags: ['vegetarian'], allergens: ['dairy'], prepTimeMinutes: 5 },
    { name: 'Fresh Lime Soda', description: 'Fresh squeezed lime with soda, salt or sugar', price: 140, category: 'beverages', dietaryTags: ['vegetarian', 'vegan', 'gluten-free'], prepTimeMinutes: 3 },
    // ... add 20+ more items for a realistic menu
  ];
  // Bulk insert all menu items
  
  // 5. Create 10 guests at various tiers
  const guests = [
    { fullName: 'Priya Mehta', phone: '+919876543210', loyaltyTier: 'gold', loyaltyPoints: 4820, lifetimePoints: 12400, totalStays: 8, dietaryFlags: ['vegetarian'] },
    { fullName: 'Arjun Sharma', phone: '+919876543211', loyaltyTier: 'silver', loyaltyPoints: 2100, lifetimePoints: 3200, totalStays: 4 },
    { fullName: 'Kavitha Rajan', phone: '+919876543212', loyaltyTier: 'platinum', loyaltyPoints: 8500, lifetimePoints: 18000, totalStays: 14 },
    // Add 7 more guests...
  ];
  
  // 6. Create reservations: mix of confirmed (future), checked_in (today), checked_out (past)
  // Today's date ± various days
  
  // 7. Create past orders for checked_out reservations (food, laundry)
  
  // 8. Create loyalty transaction history for each guest
  
  // 9. Create sample feedback for past reservations
  
  console.log('Demo environment seeded successfully!');
  console.log('Staff login: manager@grandchennai.com / demo1234');
  console.log('Guest phone: +919876543210 (use any 6-digit OTP in dev mode)');
}
\`\`\`

## STEP 2 — Integration tests (tests/integration/)

### Full guest flow test (tests/integration/guest-flow.test.ts)
\`\`\`typescript
describe('Guest full flow', () => {
  let accessToken: string;
  let reservationId: string;
  let orderId: string;

  test('1. Guest sends OTP', async () => {
    const res = await request(authServiceUrl)
      .post('/api/v1/auth/otp/send')
      .send({ phone: '+919876543210' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('2. Guest verifies OTP', async () => {
    // In test mode, OTP is stored in Redis — fetch it directly
    const otp = await redis.get('otp:+919876543210').then(v => JSON.parse(v!).code);
    const res = await request(authServiceUrl)
      .post('/api/v1/auth/otp/verify')
      .send({ phone: '+919876543210', otp });
    expect(res.status).toBe(200);
    accessToken = res.body.access_token;
    expect(accessToken).toBeDefined();
  });

  test('3. Guest fetches active reservation', async () => {
    const res = await request(bookingServiceUrl)
      .get('/api/v1/reservations/active')
      .set('Authorization', \`Bearer \${accessToken}\`);
    expect(res.status).toBe(200);
    reservationId = res.body.id;
    expect(res.body.status).toBe('checked_in');
  });

  test('4. Guest fetches menu', async () => {
    const res = await request(ordersServiceUrl)
      .get('/api/v1/menu')
      .set('Authorization', \`Bearer \${accessToken}\`);
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThan(0);
  });

  test('5. Guest places food order', async () => {
    const menu = await request(ordersServiceUrl).get('/api/v1/menu').set('Authorization', \`Bearer \${accessToken}\`);
    const item = menu.body.items[0];
    
    const res = await request(ordersServiceUrl)
      .post('/api/v1/orders')
      .set('Authorization', \`Bearer \${accessToken}\`)
      .send({
        reservation_id: reservationId,
        type: 'food',
        items: [{ menu_item_id: item.id, name: item.name, quantity: 1, unit_price: item.price }],
        payment_method: 'folio',
      });
    expect(res.status).toBe(201);
    orderId = res.body.order_id;
    expect(res.body.status).toBe('pending');
  });

  test('6. Order status is retrievable', async () => {
    const res = await request(ordersServiceUrl)
      .get(\`/api/v1/orders/\${orderId}\`)
      .set('Authorization', \`Bearer \${accessToken}\`);
    expect(res.status).toBe(200);
  });

  test('7. Guest views folio', async () => {
    const res = await request(bookingServiceUrl)
      .get(\`/api/v1/reservations/\${reservationId}/folio\`)
      .set('Authorization', \`Bearer \${accessToken}\`);
    expect(res.status).toBe(200);
    expect(res.body.total_amount).toBeGreaterThan(0);
  });
});
\`\`\`

### BullMQ event flow test
Test that booking.checked_in event → key provisioned within 5 seconds:
\`\`\`typescript
test('Key provisioned after checked_in event', async () => {
  await bookingEventsQueue.add('booking.checked_in', {
    reservationId: testReservationId,
    guestId: testGuestId,
    roomId: testRoomId,
  });
  
  // Poll for key in Redis for up to 5 seconds
  let keyData = null;
  for (let i = 0; i < 10; i++) {
    await sleep(500);
    const raw = await redis.get(\`key:\${testReservationId}\`);
    if (raw) { keyData = JSON.parse(raw); break; }
  }
  
  expect(keyData).not.toBeNull();
  expect(keyData.status).toBe('active');
  expect(keyData.keyToken).toMatch(/^MOCK_BLE_/);
});
\`\`\`

## STEP 3 — Postman collection (tests/Hotel_OS.postman_collection.json)
Create a complete Postman collection with:
- Environment variables: base_url, access_token, reservation_id, order_id
- Pre-request scripts that handle token refresh
- All 40+ endpoints organized in folders matching service names
- Example request bodies for all POST/PATCH endpoints
- Test scripts that validate response shapes

## STEP 4 — Load test (tests/load-test.js using k6)
\`\`\`javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 100,        // 100 virtual users (guests)
  duration: '60s',
  thresholds: {
    http_req_duration: ['p(95)<500'],  // P95 < 500ms
    http_req_failed: ['rate<0.01'],    // < 1% error rate
  },
};

export default function() {
  // Simulate guest checking menu
  const menuRes = http.get(\`\${BASE_URL}/api/v1/menu\`, {
    headers: { Authorization: \`Bearer \${ACCESS_TOKEN}\` },
  });
  check(menuRes, { 'menu status 200': (r) => r.status === 200 });
  sleep(1);
  
  // Simulate guest fetching reservation
  const resRes = http.get(\`\${BASE_URL}/api/v1/reservations/active\`, {
    headers: { Authorization: \`Bearer \${ACCESS_TOKEN}\` },
  });
  check(resRes, { 'reservation status 200': (r) => r.status === 200 });
  sleep(2);
}
\`\`\`

## Acceptance criteria
- pnpm seed:demo completes without errors and shows summary
- All integration tests pass with zero failures
- BullMQ event flow test passes: key provisioned within 5 seconds
- Load test shows P95 < 500ms at 100 concurrent users
- Postman collection imports and all requests work with demo environment credentials`
},

];

// ═══════════════════════════════════════════════════════════
// BUILD THE DOCUMENT
// ═══════════════════════════════════════════════════════════

const phaseColors = { 'Phase 1': C.teal, 'Phase 2': C.purple, 'Python': C.amber };

const children = [

  // ── COVER ─────────────────────────────────────────────────
  new Table({width:{size:9360,type:WidthType.DXA},columnWidths:[9360],rows:[
    new TableRow({children:[new TableCell({borders:none(),shading:{fill:C.dark,type:ShadingType.CLEAR},margins:{top:600,bottom:0,left:480,right:480},children:[
      p([r('HOTEL OS',{size:72,bold:true,color:C.white})],{sb:0,sa:0}),
      p([r('Claude Code Task Prompts',{size:32,bold:true,color:C.teal})],{sb:80,sa:0}),
    ]})]}),
    new TableRow({children:[new TableCell({borders:{top:{style:BorderStyle.SINGLE,size:6,color:C.teal},bottom:none().bottom,left:none().left,right:none().right},shading:{fill:C.dark,type:ShadingType.CLEAR},margins:{top:200,bottom:0,left:480,right:480},children:[
      p([r('19 tasks  ·  Each prompt is complete and self-contained',{size:22,color:'8BAFD4'})],{sb:0,sa:0}),
      p([r('Copy each task prompt directly into Claude Code to build Hotel OS',{size:20,color:'6A8CB0'})],{sb:80,sa:0}),
    ]})]}),
    new TableRow({children:[new TableCell({borders:none(),shading:{fill:C.dark,type:ShadingType.CLEAR},margins:{top:400,bottom:600,left:480,right:480},children:[
      p([r('Phase 1 (Tasks T-01–T-16): Guest app + all services + staff app',{size:20,color:'6A8CB0'})],{sb:0,sa:40}),
      p([r('Phase 2 (Tasks T-17–T-19): Dashboard + integration tests',{size:20,color:'6A8CB0'})],{sb:0,sa:0}),
    ]})]}),
  ]}),
  pb(),

  // ── TOC ───────────────────────────────────────────────────
  h1('Task Index'),
  new TableOfContents('Task Index',{hyperlink:true,headingStyleRange:'1-2'}),
  pb(),

  // ── HOW TO USE ────────────────────────────────────────────
  h1('How to Use These Prompts'),
  bod('Each task below is a complete, self-contained Claude Code prompt. You do not need to reference previous tasks — each prompt includes all context Claude Code needs. Work through the tasks in order (T-01 first, T-19 last).'),
  sp(80),
  callout('Important','Complete T-01 (monorepo scaffold) and T-02 (database schema) before any other task. All other tasks depend on the foundation these create.',C.coral,'FAECE7'),
  sp(),
  infoTbl([
    ['How to use','Instructions'],
    ['Open Claude Code','Open a new Claude Code session for each task'],
    ['Copy the prompt','Copy the complete prompt block from the task — it starts with "You are building..." or similar directive'],
    ['Paste and run','Paste the prompt into Claude Code. Claude Code will create all the files described.'],
    ['Verify','Check the acceptance criteria at the bottom of each task before moving to the next'],
    ['Order matters','Tasks must be done in T-01 → T-19 order. Each builds on the previous.'],
    ['Context','If Claude Code needs context, refer it to the CLAUDE.md file created in T-01 and the PRD document'],
  ],2800),
  sp(),
  infoTbl([
    ['Phase','Tasks','Duration','What gets built'],
    ['Foundation','T-01, T-02','2 days','Monorepo, schema, toolchain'],
    ['Phase 1 — Backend','T-03 to T-09','8 days','All 6 microservices + AI service'],
    ['Phase 1 — Mobile','T-10 to T-16','8 days','Complete guest + staff React Native apps'],
    ['Phase 2 — Dashboard','T-17, T-18','4 days','Full Next.js web dashboard'],
    ['Testing','T-19','1 day','Integration tests + seed data'],
  ],2800),
  pb(),
];

// Generate task pages
tasks.forEach((task, idx) => {
  // Task banner
  children.push(taskBanner(task.num, task.title, task.phase, task.effort, task.color));
  children.push(sp(120));

  // Objective
  children.push(h3('Objective'));
  children.push(bod(task.objective));
  children.push(sp(60));

  // Dependencies
  children.push(callout('Dependencies', task.dependencies, C.coral, 'FAECE7'));
  children.push(sp(100));

  // Expected outputs
  children.push(h3('Expected outputs'));
  task.outputs.forEach(o => children.push(bul(o)));
  children.push(sp(100));

  // Prompt
  children.push(h3('Claude Code prompt — paste this complete block'));
  children.push(callout('Instruction','Copy everything below this line and paste into a new Claude Code session.',C.teal,'E1F5EE'));
  children.push(sp(80));
  children.push(...codeBlock(task.prompt));

  // Page break between tasks (except last)
  if (idx < tasks.length - 1) children.push(pb());
});

// ── FINAL PAGE ─────────────────────────────────────────────
children.push(pb());
children.push(new Table({width:{size:9360,type:WidthType.DXA},columnWidths:[9360],rows:[
  new TableRow({children:[new TableCell({borders:none(),shading:{fill:C.dark,type:ShadingType.CLEAR},margins:{top:700,bottom:700,left:480,right:480},children:[
    p([r('All 19 tasks complete.',{size:28,bold:true,color:C.white})],{sb:0,sa:80,align:AlignmentType.CENTER}),
    p([r('Hotel OS is fully built.',{size:22,color:C.teal})],{sb:0,sa:0,align:AlignmentType.CENTER}),
  ]})]}),
]}));

// ── ASSEMBLE ───────────────────────────────────────────────
const doc = new Document({
  numbering:{config:[
    {reference:'bullets',levels:[{level:0,format:LevelFormat.BULLET,text:'\u2022',alignment:AlignmentType.LEFT,style:{paragraph:{indent:{left:720,hanging:360}}}}]},
    {reference:'numbers',levels:[{level:0,format:LevelFormat.DECIMAL,text:'%1.',alignment:AlignmentType.LEFT,style:{paragraph:{indent:{left:720,hanging:360}}}}]},
  ]},
  styles:{
    default:{document:{run:{font:'Arial',size:22}}},
    paragraphStyles:[
      {id:'Heading1',name:'Heading 1',basedOn:'Normal',next:'Normal',quickFormat:true,run:{size:30,bold:true,font:'Arial',color:C.navy},paragraph:{spacing:{before:480,after:180},outlineLevel:0}},
      {id:'Heading2',name:'Heading 2',basedOn:'Normal',next:'Normal',quickFormat:true,run:{size:24,bold:true,font:'Arial',color:C.navy},paragraph:{spacing:{before:320,after:140},outlineLevel:1}},
      {id:'Heading3',name:'Heading 3',basedOn:'Normal',next:'Normal',quickFormat:true,run:{size:22,bold:true,font:'Arial',color:C.teal},paragraph:{spacing:{before:220,after:100},outlineLevel:2}},
      {id:'Heading4',name:'Heading 4',basedOn:'Normal',next:'Normal',quickFormat:true,run:{size:21,bold:true,font:'Arial',color:C.muted},paragraph:{spacing:{before:160,after:80},outlineLevel:3}},
    ],
  },
  sections:[{
    properties:{page:{size:{width:12240,height:15840},margin:{top:1296,right:1296,bottom:1296,left:1296}}},
    headers:{default:new Header({children:[new Paragraph({
      children:[r('Hotel OS — Claude Code Task Prompts',{size:18,color:C.muted}),new TextRun({children:['\t',PageNumber.CURRENT],font:'Arial',size:18,color:C.muted})],
      spacing:{before:0,after:0},
      border:{bottom:{style:BorderStyle.SINGLE,size:4,color:C.mid,space:6}},
      tabStops:[{type:TabStopType.RIGHT,position:9360}],
    })]})},
    footers:{default:new Footer({children:[new Paragraph({
      children:[r('Hotel OS  ·  19 tasks  ·  Complete build guide for Claude Code',{size:15,color:C.muted})],
      spacing:{before:0,after:0},
      border:{top:{style:BorderStyle.SINGLE,size:4,color:C.mid,space:6}},
    })]})},
    children,
  }],
});

Packer.toBuffer(doc).then(buf=>{
  fs.writeFileSync('/mnt/user-data/outputs/HotelOS_ClaudeCode_Tasks.docx',buf);
  console.log('Done: HotelOS_ClaudeCode_Tasks.docx');
}).catch(e=>{console.error(e.message);process.exit(1)});
