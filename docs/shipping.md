# Shipping Service

Purpose: manage shipments with carrier, tracking, and status updates.

- Port: 3080 (default)
- Env: `SHIPPING_SERVICE_URL`
- Storage: in-memory (placeholder)
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

