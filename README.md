# Coffee Shop POS

![Next.js](https://img.shields.io/badge/Next.js%2016-black?style=flat-square&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React%2019-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS%204-38BDF8?style=flat-square&logo=tailwindcss&logoColor=white)
![Drizzle ORM](https://img.shields.io/badge/Drizzle%20ORM-C5F74F?style=flat-square&logo=drizzle&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=flat-square&logo=supabase&logoColor=white)
![Better Auth](https://img.shields.io/badge/Better%20Auth-000000?style=flat-square&logo=auth0&logoColor=white)

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
