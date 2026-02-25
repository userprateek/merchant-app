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

### Identity and Access Control
- Account creation via signup and admin user-management.
- Password storage using **salt + pepper + MD5** hashing (as configured for this project).
- Session-based authentication with server-side session persistence.
- Route-level and action-level role checks.
- Roles supported:
  - `ADMIN`
  - `MANAGER`
  - `PACKING_CREW`
  - `VIEWER`

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
PASSWORD_PEPPER="your-strong-password-pepper"
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

### Seeded Demo Users

After `npx prisma db seed`, these users are created:

- `admin@merchant.local` / `admin123` (`ADMIN`)
- `manager@merchant.local` / `manager123` (`MANAGER`)
- `packing@merchant.local` / `packing123` (`PACKING_CREW`)
- `viewer@merchant.local` / `viewer123` (`VIEWER`)

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

## Access Model

### Public Routes
- `/login`
- `/signup`
- `/unauthorized`

### Protected Routes
- `/` (home)
- `/products/*`
- `/channels/*`
- `/orders/*`
- `/dashboard`
- `/integrations`
- `/admin/users`

### Role-Based Rights

- `ADMIN`
  - Full access to all routes and operations.
  - Can create/enable/disable users and assign roles.

- `MANAGER`
  - Product, channel, listing, order, dashboard, and integration access.
  - Can run managerial order actions (confirm/cancel/pull) and operational actions (pack/ship).

- `PACKING_CREW`
  - Order and dashboard access.
  - Can perform packing/shipping actions.
  - Cannot access product/channel/admin/integration management routes.

- `VIEWER`
  - Dashboard-only access.
  - No write operations.

## REST API (Mobile/External Clients)

Base path: `/api/v1`

### Auth Flow

1. `POST /api/v1/auth/signup` (public)  
   Creates account with `VIEWER` role and returns access token.
2. `POST /api/v1/auth/login` (public)  
   Returns short-lived bearer token.
3. Use header on all protected APIs:  
   `Authorization: Bearer <token>`
4. `POST /api/v1/auth/logout` invalidates current token.

Token TTL is short-lived (currently 1 hour).

### Public API Endpoints

- `POST /api/v1/auth/signup`
- `POST /api/v1/auth/login`

### Protected API Endpoints

- Auth/session
  - `GET /api/v1/auth/me`
  - `POST /api/v1/auth/logout`

- Products
  - `GET /api/v1/products`
  - `POST /api/v1/products`
  - `GET /api/v1/products/:id`
  - `PATCH /api/v1/products/:id`
  - `DELETE /api/v1/products/:id`
  - `POST /api/v1/products/:id/stock`
  - `GET /api/v1/products/:id/content`
  - `PUT /api/v1/products/:id/content`
  - `GET /api/v1/products/:id/listings`
  - `POST /api/v1/products/:id/listings`

- Listings
  - `PATCH /api/v1/listings/:id`

- Channels
  - `GET /api/v1/channels`
  - `GET /api/v1/channels/:id`
  - `PATCH /api/v1/channels/:id`

- Orders
  - `GET /api/v1/orders`
  - `GET /api/v1/orders/:id`
  - `POST /api/v1/orders/:id/actions`
  - `POST /api/v1/orders/actions/bulk`
  - `POST /api/v1/orders/pull`
  - `POST /api/v1/orders/poll-updates`

- Integrations
  - `GET /api/v1/integrations`
  - `POST /api/v1/integrations/:id/retry`

- Dashboard
  - `GET /api/v1/dashboard`

- Admin Users
  - `GET /api/v1/admin/users`
  - `POST /api/v1/admin/users`
  - `PATCH /api/v1/admin/users/:id`

### Channel Webhook Endpoint

- `POST /api/channels/:id/events` (channel-to-system callback)
  - Header: `x-webhook-secret`
  - Supported events:
    - `ORDER_CANCELLED_BY_CUSTOMER`
    - `ORDER_RETURNED_TO_WAREHOUSE`

## Current Roadmap

See [EXECUTION_ROADMAP.md](./EXECUTION_ROADMAP.md) for P0/P1/P2 delivery plan and ongoing implementation status.
