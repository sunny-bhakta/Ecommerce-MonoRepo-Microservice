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

