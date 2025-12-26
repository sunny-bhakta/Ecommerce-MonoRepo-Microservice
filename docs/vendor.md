# Vendor Service

Service that owns vendor onboarding, profile data, and KYC status. It is exposed as an HTTP NestJS service and is reachable via the gateway using `VENDOR_SERVICE_URL` (defaults to port `3030`).

## Functional scope
- Create vendor profiles with company and contact information.
- Track KYC status (`pending` → `verified`/`rejected`).
- Retrieve or update vendor records.
- Health reporting via `/health`.

## Data model (planned with DB storage)
- `id` (UUID), `name`, `email` (lowercased, unique), `companyName`.
- Optional: `gstNumber`, `address`.
- `kycStatus`: `pending | verified | rejected` (defaults to `pending`).
- Timestamps: `createdAt`, `updatedAt`.
- Indexes: unique index on `email`; optional index on `companyName`.

## API surface
- `GET /health` → `{ service, status, vendors, timestamp }`.
- `POST /vendors`
  - Body: `name`, `email`, `companyName` (required), `gstNumber?`, `address?`.
  - Returns created vendor with generated `id` and `kycStatus: pending`.
- `GET /vendors` → array of vendors.
- `GET /vendors/:id` → single vendor (404 if missing).
- `PATCH /vendors/:id`
  - Body: any subset of `name`, `email`, `companyName`, `gstNumber`, `address`, `kycStatus`.
  - Returns the updated vendor with refreshed `updatedAt`.

## Validation
- `CreateVendorDto`: `name`, `email` (valid email), `companyName` are required strings; `gstNumber` and `address` optional strings.
- `UpdateVendorDto`: all fields optional; `email` validated as email; `kycStatus` limited to the three allowed values.

## Behaviour notes
- Emails are lowercased on create/update.
- `kycStatus` defaults to `pending`; can be changed via update.
- Currently uses in-memory storage; replace with DB (PostgreSQL recommended).
- Missing vendor lookups raise `NotFoundException`.

## Persistence plan (replace in-memory)
- Use a DB client aligned with the rest of the stack (e.g., Prisma + PostgreSQL or TypeORM).
- Create `vendors` table with the columns above; add `created_at`/`updated_at` managed by the ORM.
- Update the service to:
  - Inject a repository/Prisma service instead of storing in an array.
  - Generate `id` via DB/ORM (or keep UUID generation).
  - Add uniqueness guard on `email`; return 409 if duplicate.
  - Include pagination for `listVendors`.
- Add migrations and `.env` variables: `DATABASE_URL` for the vendor service, and wire to docker compose if present.

## Requirements alignment
- Covers onboarding basics and KYC status tracking from the platform requirements.
- Vendor role: vendors authenticate via the Auth service (JWT). After login, they can:
  - Manage their vendor profile (through the vendor service).
  - Create and manage products via Catalog service endpoints that accept the vendor context (to be enforced via gateway/auth guards).
  - View/manage their orders via Order service endpoints scoped to their vendor id (future work).
- Missing pieces to reach full spec: document upload/verification workflow, admin approval, commission & payout setup, vendor analytics, vendor-facing dashboard endpoints, and wiring vendor authorization into catalog/order flows.

## Gateway integration
- Gateway proxies vendor routes; ensure `VENDOR_SERVICE_URL` is set (default `http://localhost:3030`).
- Health bubbling: vendor health feeds into gateway `/health` aggregation.

## Self-registration & login (via Gateway/Auth)
- Register vendor user: `POST /auth/vendor/register` with `{ email, password, fullName? }`. This creates an auth user with the `vendor` role.
- Login vendor user: `POST /auth/vendor/login` with `{ email, password }` to obtain a JWT.
- Current behavior: vendor profiles (`/vendors` CRUD) are still admin-only via the gateway. After registration, an admin should create or approve the vendor profile in the vendor service.
- Product creation: vendors with a token can call `POST /catalog/products` through the gateway; products are auto-tagged with the vendor id and start as `pending` until an admin approves with `PATCH /catalog/products/:id/status`.

## Quick reference (code)
- Controller routes: `apps/vendor/src/app.controller.ts`.
- Service logic & in-memory store: `apps/vendor/src/app.service.ts`.
- DTO validation: `apps/vendor/src/dto/create-vendor.dto.ts`, `apps/vendor/src/dto/update-vendor.dto.ts`.

## TODO / Improvements

1. [ ] **Database-backed persistence**
  - [ ] Replace in-memory array with TypeORM/Prisma + PostgreSQL (or SQLite) and migrations.
  - [ ] Enforce unique email/company constraints and add pagination filters.

2. [ ] **KYC workflow**
  - [ ] Store document metadata/uploads, track review status, and expose admin approval endpoints.
  - [ ] Integrate with notification service to alert vendors about approvals/rejections.

3. [ ] **Authorization & gateway integration**
  - [ ] Ensure vendor JWTs are required for vendor-specific endpoints; admins retain override access.
  - [ ] Audit logs for profile changes (who/when/what).

4. [ ] **Vendor analytics & dashboards**
  - [ ] Expose endpoints for vendor performance (orders, revenue, cancellations) pulling from order/analytics services.
  - [ ] Add caching/aggregation for dashboard metrics.

5. [ ] **Payout & commission setup**
  - [ ] Capture bank/UPI details securely and integrate with payment service for payouts.
  - [ ] Configure commission tiers per vendor with effective dates.

