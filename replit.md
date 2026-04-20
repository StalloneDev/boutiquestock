# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite, TailwindCSS, React Query, Wouter

## Application: BoutiqueStock

A full-stack web app for fashion boutique inventory and sales management.

### Features
- Dashboard with stock value, low-stock alerts, category breakdown chart, recent activity
- Product catalog with search, filters, quick +/- stock buttons
- Sales recording (auto-deducts stock)
- Stock entries (restock / new collections)
- Movement history (full traceability)
- Category management

### Currency
Prices are stored as raw numbers and displayed in FCFA (West African CFA franc).

### Artifacts
- `artifacts/boutique` — React+Vite frontend (previewPath: `/`)
- `artifacts/api-server` — Express 5 API server (previewPath: `/api`)

### DB Schema
- `categories` — Product categories
- `products` — Product catalog (with cost/sale price, quantity, low stock threshold)
- `sales` — Sales records (auto-deducts from product quantity)
- `stock_movements` — Full traceability of all stock changes (entry, exit, adjustment, sale)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
