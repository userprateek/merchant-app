# Merchant App

Merchant App is an operations platform for brands selling across multiple commerce channels.  
It gives operators one control surface for catalog, inventory, listings, orders, and integration monitoring.

## Problem It Solves

Merchants running on multiple marketplaces often manage each channel separately, which creates:
- fragmented inventory visibility
- inconsistent listing and pricing control
- error-prone order processing
- weak traceability for integration failures

This project consolidates those workflows into a single system with guarded state transitions and operational tooling.

## Core Capabilities

### Catalog and Inventory
- Product creation with SKU uniqueness.
- Stock management with movement tracking.
- Product content management (description, metadata, attributes, images).
- Product edit, archive, and delete workflows.

### Channel Operations
- Channel configuration (credentials, environment mode, enable/disable).
- Operational gating so only valid channels can be used for listing.

### Listing Management
- Per-channel listing control with pricing adjustments (discount/markup).
- Listing/delisting with transition history.
- Content completeness checks before listing.
- Duplicate listing prevention.

### Order Management
- Order lifecycle with controlled transitions:
  `CREATED -> CONFIRMED -> PACKED -> SHIPPED -> DELIVERED`
- Cancel and return handling.
- Bulk actions for operational throughput.
- Filtering and pagination for large order sets.
- Manual order pull from enabled channels.

### Integration Observability
- Integration event logging (payload, status, response).
- Failed-log retry workflow from UI.
- Integration hooks wired into core operations (e.g., shipping, order pull).

### Operational Dashboard
- Snapshot metrics for products, listings, and orders.
- Order status distribution.
- Low-stock risk visibility.

## Architecture

- **Frontend/Application**: Next.js App Router with server actions.
- **Domain/Data Layer**: Prisma ORM with PostgreSQL.
- **Core Domains**: `Product`, `Channel`, `ChannelListing`, `Order`, `InventoryMovement`, `IntegrationLog`.
- **Modular Services**: domain logic grouped under `src/features/*`.

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL

### Installation
```bash
npm install
```

### Environment
Create `.env`:

```env
DATABASE_URL="postgresql://..."
CHANNEL_SECRET_KEY="your-strong-key"
```

### Database Setup
```bash
npx prisma migrate dev
npx prisma generate
npx prisma db seed
```

### Run
```bash
npm run dev
```

Open: [http://localhost:3000](http://localhost:3000)

## Scripts

- `npm run dev` - start local development server
- `npm run build` - build production bundle
- `npm run start` - run production server
- `npm run lint` - static lint checks
- `npm run test:core` - core service sanity checks

## Project Layout

- `src/app/` - route handlers and pages
- `src/features/` - domain services and feature modules
- `src/lib/` - shared infrastructure utilities
- `prisma/` - schema, migrations, and seed data

## Current Roadmap

See [EXECUTION_ROADMAP.md](./EXECUTION_ROADMAP.md) for P0/P1/P2 delivery plan and ongoing implementation status.
