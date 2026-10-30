# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (Turbopack)
npm run build     # Production build
npm run start     # Start production server
npm run lint      # ESLint check
```

## Stack

- **Next.js 16** App Router (all pages live under `src/app/`)
- **React 19** with Server Components by default; add `"use client"` only when needed (event handlers, hooks, browser APIs)
- **TypeScript** strict mode; path alias `@/*` → `src/*`
- **Tailwind CSS v4** — no `tailwind.config.js`; theme tokens live in `src/app/globals.css` as CSS custom properties
- **Turbopack** — the dev server uses `next dev` with Turbopack; CSS is loaded via `@tailwindcss/turbopack` loader in `next.config.ts`

## Architecture (planned)

The application is organized around three core domain concepts:

1. **Gigs** — top-level grouping; all sales and ticket data belong to a gig
2. **Products** — bar items with name, category, price, optional cost price
3. **Sales / Transactions** — each transaction snapshots the product name and price at sale time so future edits don't affect history
4. **Tickets** — basic event ticket tracking per gig

### Planned directory layout

```
src/
  app/
    layout.tsx            # Root layout (fonts, providers)
    page.tsx              # Redirect to /gigs or active gig dashboard
    gigs/                 # Gig list + creation
    gigs/[id]/
      page.tsx            # Dashboard for a specific gig
      sales/              # POS interface + history
      products/           # Product management
      tickets/            # Ticket sales
      reports/            # Stats + CSV export
  components/             # Shared UI components
  lib/
    types.ts              # Shared TypeScript interfaces
    db.ts                 # Database client (Supabase)
    storage.ts            # localStorage fallback / helpers
  hooks/                  # Custom React hooks
```

### Data model conventions

- Transactions store a **snapshot** of `productName` and `unitPrice` at the time of sale — never reference live product data for historical records
- Every transaction and ticket must reference a `gigId`
- IDs are UUIDs (`crypto.randomUUID()`)
- Amounts are stored as numbers (cents or dollars — pick one and be consistent; USD display via `Intl.NumberFormat`)

## Database: Supabase (recommended)

See setup steps below. The `lib/db.ts` file should export a single Supabase client instance created with env vars `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Env vars

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Add these to `.env.local` (already git-ignored).
