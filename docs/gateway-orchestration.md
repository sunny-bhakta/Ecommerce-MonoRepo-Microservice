# Gateway Orchestration Overview

This document explains how the API gateway orchestrates and proxies all downstream services (auth, user, vendor, catalog, inventory, order, payment, shipping, search, review, analytics, admin, notification). It lists configuration, health behaviour, and available REST endpoints exposed via the gateway.

## High-Level Flow

1. **Client calls `POST /checkout`**
   - The gateway validates the payload (`userId`, `items`, `currency`, etc.).
   - It calculates the order total if the client did not send one.
2. **Order service invocation**
   - Gateway forwards an HTTP POST to the order service (`/orders`) using the configured base URL.
   - The created order (with `id`, `status`, etc.) is returned and cached within the request context.
3. **Payment service invocation**
   - Gateway POSTs to the payment service (`/payments`) using the order id and amount.
   - The resulting payment attempt is returned to the client together with the order payload.
4. **Aggregate lookup**
   - `GET /orders/:orderId/summary` fetches the latest order entity and all payments for that order to provide a consolidated status view for frontends.

If the payment service signals a `succeeded` status the gateway tags the response with `nextSteps: "order_confirmed"`. Failed payments get `nextSteps: "retry_payment"` while all other states instruct the client to wait.

## Configuration (service URLs)

Each downstream service is resolved via an env var (full base URL). Defaults:

| Service      | Env Var                    | Default                  |
|--------------|----------------------------|--------------------------|
| Auth         | `AUTH_SERVICE_URL`         | `http://localhost:3010`  |
| User         | `USER_SERVICE_URL`         | `http://localhost:3020`  |
| Vendor       | `VENDOR_SERVICE_URL`       | `http://localhost:3030`  |
| Catalog      | `CATALOG_SERVICE_URL`      | `http://localhost:3040`  |
| Inventory    | `INVENTORY_SERVICE_URL`    | `http://localhost:3050`  |
| Order        | `ORDER_SERVICE_URL`        | `http://localhost:3060`  |
| Payment      | `PAYMENT_SERVICE_URL`      | `http://localhost:3070`  |
| Shipping     | `SHIPPING_SERVICE_URL`     | `http://localhost:3080`  |
| Review       | `REVIEW_SERVICE_URL`       | `http://localhost:3090`  |
| Analytics    | `ANALYTICS_SERVICE_URL`    | `http://localhost:3100`  |
| Admin        | `ADMIN_SERVICE_URL`        | `http://localhost:3110`  |
| Search       | `SEARCH_SERVICE_URL`       | `http://localhost:3120`  |
| Notification | `NOTIFICATION_SERVICE_URL` | `http://localhost:3130` (Python FastAPI) |

## Health Propagation

`GET /health` now returns the gateway health **and** downstream results:

```json
{
  "service": "gateway",
  "status": "ok",
  "timestamp": "2025-12-08T10:00:00.000Z",
  "dependencies": [
    { "service": "order", "status": "ok", "details": { "...": "..." } },
    { "service": "payment", "status": "error", "details": { "message": "ECONNREFUSED" } },
    { "service": "user", "status": "ok", "details": { "...": "..." } },
    { "service": "auth", "status": "ok", "details": { "...": "..." } }
  ]
}
```

The top-level status flips to `degraded` if any downstream service is unhealthy. This helps Kubernetes/monitoring stacks understand whether the gateway is usable.

## Error Handling Strategy

- All calls use Nest's `HttpModule` (Axios) with a 5s timeout.
- Errors are wrapped inside a `BadGatewayException` so clients receive consistent `502` responses that include the upstream status code and payload (when available).
- Health checks swallow upstream errors and log them as warnings; they never throw so `/health` always responds.

## Authentication Behaviour

- Every mutating/read endpoint (except `/health`) requires a Bearer token.
- `GatewayAuthGuard` calls `AUTH_SERVICE_URL/auth/me` to validate tokens issued by the auth service and injects the decoded user payload onto the request.
- `RolesGuard` reuses the `roles` array from the token to protect admin-only surfaces (`/users` CRUD).
- Checkout now derives the `userId` from the authenticated principal; clients no longer send it in the payload.

## Auth & User APIs

- `POST /auth/login`, `POST /auth/register` (from auth service)
- `GET /me/profile`, `PATCH /me/profile`
- Admin user CRUD: `POST /users`, `GET /users`, `GET /users/:id`, `PATCH /users/:id`, `DELETE /users/:id`

## Vendor APIs

- Admin-only: `POST /vendors`, `GET /vendors`, `GET /vendors/:id`, `PATCH /vendors/:id`

## Catalog APIs

- Admin-only: `POST /catalog/categories`, `POST /catalog/products`, `POST /catalog/products/:productId/variants`
- Read: `GET /catalog/categories`, `GET /catalog/products`, `GET /catalog/products/:id`, `GET /catalog/products/:productId/variants`

## Inventory APIs

- Admin-only write: `POST /warehouses`, `POST /inventory/stock`, `POST /inventory/reserve`, `POST /inventory/release`, `POST /inventory/allocate`
- Read: `GET /warehouses`, `GET /inventory/:sku`

## Order APIs

- `POST /checkout` orchestrates order + payment (requires auth)
- `GET /orders/:orderId/summary` aggregates order + payments

## Payment APIs

- `POST /payments`, `GET /payments`, `GET /payments/:id`, `POST /payments/:id/refund`, `GET /payments/:id/refunds`

## Shipping APIs (via Gateway)

- Admin-only write:
  - `POST /shipments` create a shipment (orderId, carrier, destination, optional tracking number)
  - `PATCH /shipments/:id/status` update shipment status or tracking number
- Read:
  - `GET /shipments` list shipments (optional `orderId` filter)
  - `GET /shipments/:id` get shipment

## Search APIs (via Gateway)

- Admin-only write:
  - `POST /search/index` index or update a document (id, title, description, tags)
- Read:
  - `POST /search/query` keyword search with optional tags
  - `GET /search/documents/:id` fetch an indexed document

## Review & Rating APIs (via Gateway)

- Authenticated create/flag:
  - `POST /reviews` create review (product|vendor) with rating/comment
  - `PATCH /reviews/:id/flag` flag a review with optional reason
- Read:
  - `GET /reviews` list (filters: targetId, targetType, status)
- Admin moderation:
  - `PATCH /reviews/:id/moderate` set status approved/rejected with optional note

## Analytics APIs (via Gateway)

- Authenticated ingest:
  - `POST /analytics/events` send event (order|payment|shipment) with optional amount/currency/status
- Admin metrics:
  - `GET /analytics/metrics` aggregated counts and GMV/AOV (placeholder)

## Admin / Backoffice APIs (via Gateway)

- Admin-only:
  - `POST /admin/actions` create admin action (review moderation, refund, vendor approval, order investigation)
  - `GET /admin/actions` list actions (filters: status, targetType)
  - `PATCH /admin/actions/:id` update status/resolution note

## Notification APIs (via Gateway → Python service)

- Authenticated send:
  - `POST /notifications` with `{ channel: email|sms|webpush, to, title?, body, metadata? }`
- Webpush registration:
  - `POST /notifications/webpush/register` with `{ endpoint, p256dh, auth }`

## Extending the Flow

To add another downstream service (e.g., shipping):

1. Update the `DownstreamService` union and `DEFAULT_SERVICE_URLS` map in `apps/gateway/src/app.service.ts`.
2. Add a new env var name following the `<SERVICE>_SERVICE_URL` convention.
3. Register new controller endpoints that leverage the existing HTTP helper methods.

This keeps the gateway focused on orchestration logic while downstream services own their respective domains.
