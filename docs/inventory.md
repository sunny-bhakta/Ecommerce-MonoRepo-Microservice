# Inventory Service

Purpose: track stock per warehouse, handle reserve/release/allocate flows.

- Port: 3050 (default)
- Env: `INVENTORY_SERVICE_URL`, `MONGO_URL` (default `mongodb://0.0.0.0:27017/ecommerce`)
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

## TODO / Improvements

1. [ ] **Transactional stock workflows**
  - [ ] Implement DB transactions / distributed locks for reserve → release → allocate flows.
  - [ ] Add idempotency keys so duplicate requests don’t double-reserve.

2. [ ] **Order/payment integration**
  - [ ] Hook into order checkout to auto-reserve inventory per line item.
  - [ ] Auto-allocate (or release) when payment succeeds/fails via event handlers.

3. [ ] **Alerting & thresholds**
  - [ ] Introduce safety stock levels per SKU/warehouse.
  - [ ] Emit notifications/webhooks when stock drops below threshold or goes negative.

4. [ ] **Data model & performance**
  - [ ] Add indexes on `sku` + `warehouseId`, plus historical tables for adjustments.
  - [ ] Support batch updates and import/export for large catalogs.

5. [ ] **Operational tooling**
  - [ ] Build audit logs for stock movements (who/what/when).
  - [ ] Expose metrics (available vs reserved, failed allocs) for dashboards.

