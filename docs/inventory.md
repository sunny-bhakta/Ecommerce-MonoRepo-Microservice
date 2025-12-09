# Inventory Service

Purpose: track stock per warehouse, handle reserve/release/allocate flows.

- Port: 3050 (default)
- Env: `INVENTORY_SERVICE_URL`, `MONGO_URL` (default `mongodb://localhost:27017/ecommerce`)
- Persistence: MongoDB (Mongoose) — collections `warehouses`, `stocks` (unique sku+warehouseId)
- Key endpoints:
  - `GET /health`
  - `POST /warehouses`, `GET /warehouses`
  - `POST /inventory/stock` (upsert onHand per warehouse)
  - `GET /inventory/:sku` (availability)
  - `POST /inventory/reserve`, `/release`, `/allocate`
- Notes: Admin-only writes via gateway; availability returns per-warehouse and totals.

## Extending
- Add transactions for atomic reserve/release/allocate to avoid race conditions.
- Integrate with orders to auto-reserve on checkout and auto-allocate on payment success.
- Add safety stock thresholds and low-stock alerts via notifications.

