# Order Service

Purpose: cart/checkout orchestration, order creation, lifecycle updates, emits events.

- Port: 3060 (default)
- Env: `ORDER_SERVICE_URL`, DB via TypeORM (PostgreSQL/SQLite depending on config)
- Events: emits `OrderCreatedEvent` to downstream (order events client)
- Key endpoints:
  - `GET /health`
  - `POST /orders` (create)
  - `GET /orders` (optional userId filter)
  - `GET /orders/:id`
- Notes: Gateway orchestrates checkout → order + payment; statuses updated from payment events.

## Extending
- Add cart service and pricing rules (tax, shipping, discounts) before create.
- Add idempotency keys for order creation.
- Add audit trail and status transitions (pending → paid → fulfilled → completed/cancelled).

## TODO / Improvements

1. [ ] **Cart & pricing pipeline**
  - [ ] Introduce dedicated cart service (line items, coupons, shipping options).
  - [ ] Apply pricing rules (tax, discounts, shipping) before order creation.

2. [ ] **Idempotent order creation**
  - [ ] Accept `Idempotency-Key` headers and enforce uniqueness per customer/cart.
  - [ ] Persist request hash to avoid double orders on retries.

3. [ ] **Lifecycle & audit trail**
  - [ ] Model states (`pending`, `paid`, `fulfilled`, `cancelled`, etc.) with transition guards.
  - [ ] Store status change history (who/what/when) for compliance.

4. [ ] **Event integrations**
  - [ ] Emit richer domain events (`order.updated`, `order.fulfilled`).
  - [ ] Subscribe to payment/shipping events to auto-progress statuses.

5. [ ] **Operational tooling**
  - [ ] Add reporting endpoints (orders by status/vendor/time window).
  - [ ] Build reconciliation jobs for stuck/long-running orders.

