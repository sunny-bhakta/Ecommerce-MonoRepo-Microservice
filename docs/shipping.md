# Shipping Service

Purpose: manage shipments with carrier, tracking, and status updates.

- Port: 3080 (default)
- Env: `SHIPPING_SERVICE_URL`
- Storage: SQLite via TypeORM (file at `data/shipping/shipping.db` by default)
- Key endpoints:
  - `GET /health`
  - `POST /shipments`
  - `GET /shipments` (optional orderId)
  - `GET /shipments/:id`
  - `PATCH /shipments/:id/status`
- Notes: Admin writes via gateway; add persistence/provider integration later.

## Extending
- Integrate carrier APIs for label purchase/tracking webhooks.
- Persist shipments and events; add rate shopping and SLA estimates.
- Link to inventory allocations and order fulfillment steps.

## TODO / Improvements

1. [ ] **Carrier integrations**
  - [ ] Connect to carrier APIs (Shippo/EasyPost/etc.) for label purchase and tracking webhooks.
  - [ ] Store carrier account credentials and label artifacts.

2. [ ] **Persistence & rate shopping**
  - [ ] Migrate from SQLite to a scalable datastore with migrations.
  - [ ] Add rate shopping service to compare carriers and SLAs.

3. [ ] **Fulfillment automation**
  - [ ] Tie shipments to inventory allocations and order statuses.
  - [ ] Auto-create shipments when orders move to `fulfilled`.

4. [ ] **SLA & alerts**
  - [ ] Track promised vs actual delivery times; alert when shipments are late.
  - [ ] Provide customer-facing status feeds with ETA updates.

5. [ ] **Operational tooling**
  - [ ] Build dashboards for shipments by status/carrier/region.
  - [ ] Add retry/DLQ mechanisms for failed carrier calls.

