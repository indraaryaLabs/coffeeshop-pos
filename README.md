# Coffee Shop POS

![CI](https://github.com/indraaryaLabs/coffeeshop-pos/actions/workflows/ci.yml/badge.svg)
![Next.js](https://img.shields.io/badge/Next.js%2016-black?style=flat-square&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React%2019-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS%204-38BDF8?style=flat-square&logo=tailwindcss&logoColor=white)
![Drizzle ORM](https://img.shields.io/badge/Drizzle%20ORM-C5F74F?style=flat-square&logo=drizzle&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Better Auth](https://img.shields.io/badge/Better%20Auth-000000?style=flat-square&logo=auth0&logoColor=white)

A production-shaped point-of-sale system for a coffee shop — Indonesian UI for cashiers, IDR currency throughout, shift management, and recipe-based inventory deduction that actually decrements beans and milk when a latte is sold.

## Why this exists

Most "POS clone" projects stop at cart + checkout. The part this project gets right is the inventory side: menu items are linked to their raw-material recipes, so selling a latte deducts milk and coffee beans from stock instead of just decrementing a "latte" counter. If an ingredient runs out, the POS screen marks that menu item unavailable automatically rather than letting a barista sell something the shop can't make.

## Features

- **POS screen** — category-filtered product grid, cart, three payment methods (Tunai / Kartu / QRIS), quick-cash with change preview, discount input, and thermal-receipt printing via `react-to-print`
- **Shift management** — a sale requires an open shift; closing a shift produces a Z-report summary with counted-vs-expected cash
- **Recipe-based inventory** — menu products map to raw-material ingredients with quantities; checkout deducts stock race-safely (conditional `UPDATE`s) and flags items unavailable when an ingredient runs short
- **Inventory management** — stock levels, suppliers, low-stock / out-of-stock status, restock and product CRUD (admin only), image upload validated to 5 MB JPG/PNG/WebP
- **Reports** — revenue, order count, average ticket, volume trends and category breakdown (Recharts), date-range and payment-method filters, PDF print + CSV export, admin-only void with automatic stock restoration
- **Settings** — shop profile (name, address, phone, receipt footer, tax toggle) rendered on receipts, user role management (admin promotes/demotes baristas), shift history with cash difference
- **Dashboard** — today's revenue, items sold, low-stock watch, weekly revenue/orders chart, top sellers, recent transactions with status/payment filters and CSV export
- **Role-based auth** — admin and barista roles via Better Auth; new accounts always start as `barista` (role is server-managed, not client-settable)

## Stack

- **Framework** — Next.js 16 (App Router), React 19, TypeScript
- **Database** — PostgreSQL 15+ with Drizzle ORM (schema + migrations in `drizzle/`); works with local Docker or hosted Postgres (Supabase, Neon, …)
- **Auth** — Better Auth with a Drizzle adapter
- **UI** — Tailwind CSS, shadcn/ui-style components, Framer Motion, Zustand for client state, Recharts for charts
- **CI** — GitHub Actions: type-check, lint, schema push, seed, and build against a Postgres service container

## Getting started

Requirements: Node.js 22+ and a running PostgreSQL instance.

```bash
# 1. Start Postgres (Docker) or point DATABASE_URL at a hosted instance
docker run --name coffee-pos-db -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=coffee_pos -p 5432:5432 -d postgres:17-alpine

# 2. Install and configure
npm install
cp .env.example .env
# edit .env → set DATABASE_URL and ADMIN_EMAIL / ADMIN_PASSWORD

# 3. Apply schema, create the admin, load demo data
npm run db:push
npm run create-admin
npm run db:seed

# 4. Run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with the admin credentials from `.env`. Barista accounts can be created from the signup page — roles are managed later by an admin in **Pengaturan → Pengguna**. In production, `NEXT_PUBLIC_APP_URL` must match the deployed origin.

### Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | yes | Auth signing secret (`openssl rand -hex 32`) |
| `NEXT_PUBLIC_APP_URL` | yes | Public origin of the app (Better Auth client base) |
| `NEXT_PUBLIC_SUPABASE_URL` | no | Supabase storage for product photo uploads |
| `SUPABASE_SERVICE_ROLE_KEY` | no | Supabase service role key for uploads |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | no | Supabase anon key (fallback for uploads) |
| `ADMIN_NAME` / `ADMIN_EMAIL` / `ADMIN_PASSWORD` | for `create-admin` | Bootstrap admin account |

Without Supabase keys, product photo uploads fall back to a local placeholder; everything else works with plain Postgres.

### Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js dev / production build / serve |
| `npm run lint` | ESLint over the repo |
| `npm run db:push` | Push the Drizzle schema to `DATABASE_URL` |
| `npm run db:seed` | Load idempotent synthetic demo data |
| `npm run create-admin` | Create the bootstrap admin from `.env` |

## Project structure

```
src/app/(auth)/        # login, signup (Indonesian UI)
src/app/(dashboard)/   # dashboard, POS, inventory, reports, settings
src/components/pos/    # product grid, cart, order sidebar, thermal receipt
src/components/        # dashboard / reports / inventory / settings / layout / ui
src/lib/db/schema.ts   # Drizzle schema: products, inventory, recipes, transactions, shifts, shop_settings
src/lib/actions/       # server actions: transactions, products, inventory, settings
scripts/               # create-admin, seed loader, synthetic_data.sql
drizzle/               # SQL migrations
public/images/         # product photos + placeholder
.github/workflows/     # CI
```

## Notes

- Currency is IDR (`Rp`) throughout the UI; sales totals are recomputed server-side from database prices, discounts are clamped to `[0, subtotal]`, and cash requires paid ≥ total.
- Admin-gated actions (product CRUD, restock, void, role management) are enforced both in the UI and inside the server actions.

## License

[MIT](LICENSE). Security issues should be reported through [SECURITY.md](SECURITY.md) — please don't open public issues for them.
