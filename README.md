# Coffee Shop POS

A point-of-sale and inventory system for a coffee shop, built to handle the whole flow from cashier checkout to stock tracking — not just a checkout screen bolted onto a database.

## Why this exists

Most "POS clone" projects stop at cart + checkout. The part I wanted to get right here is the inventory side: menu items are linked to their raw-material recipes, so selling a latte actually deducts milk and coffee beans from stock, not just decrements a "latte" counter. If an ingredient runs out, the POS screen marks that menu item unavailable automatically instead of letting a barista sell something the shop can't make.

## Features

- **POS screen** — category-filtered product grid, cart, multiple payment methods (cash / card / QR), thermal-receipt-style printing via `react-to-print`
- **Recipe-based inventory** — menu products are mapped to raw-material ingredients with quantities; checkout auto-deducts stock and flags items as unavailable when an ingredient is short
- **Inventory management** — stock levels, supplier info, low-stock / out-of-stock status per item
- **Reports dashboard** — revenue, order count, average ticket, volume trends and category breakdown (Recharts), with date-range and payment-method filters, exportable/printable summary
- **Role-based auth** — admin and barista roles via Better Auth, session-backed, Postgres-stored
- **Seed data** — a synthetic-data script to populate a fresh database for demoing or local development

## Stack

- **Framework**: Next.js 16 (App Router), React 19, TypeScript
- **Database**: PostgreSQL via Supabase, Drizzle ORM (schema + migrations in `drizzle/`)
- **Auth**: Better Auth with a Drizzle adapter
- **UI**: Tailwind CSS, shadcn/ui components, Framer Motion, Zustand for client state
- **Charts**: Recharts

## Getting started

```bash
npm install
cp .env.example .env   # fill in DATABASE_URL, DIRECT_URL and the Supabase keys
npm run db:push        # push the Drizzle schema to your database
npm run create-admin   # optional: create an admin account (ADMIN_EMAIL / ADMIN_PASSWORD from .env)
npm run db:seed        # optional: load synthetic demo data
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with the admin credentials from `.env`. Barista accounts can be created from the signup page. In production, `NEXT_PUBLIC_APP_URL` must match the deployed origin.

## Project structure

```
src/app/(auth)/        # login, signup
src/app/(dashboard)/   # POS, inventory, reports, settings
src/lib/db/schema.ts   # Drizzle schema: products, inventory, recipes, transactions
src/lib/actions/       # server actions for inventory, products, transactions
scripts/               # seed + synthetic data + admin creation for local demos
.env.example           # environment variable reference (copy to .env)
```
