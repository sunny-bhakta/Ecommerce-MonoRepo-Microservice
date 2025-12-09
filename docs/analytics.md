# Analytics Service

Purpose: ingest order/payment/shipment events and expose aggregates (placeholder).

- Port: 3100 (default)
- Env: `ANALYTICS_SERVICE_URL`
- Storage: in-memory counters/totals
- Key endpoints:
  - `GET /health`
  - `POST /analytics/events`
  - `GET /analytics/metrics`
- Notes: Consider persisting to time-series/warehouse later; metrics include counts, GMV, AOV, payment attempts.

## Extending
- Persist events/metrics to a warehouse or time-series DB; add rollups.
- Add dashboards/queries for funnels, retention, and cohort analysis.
- Wire ingestion to real event bus (Kafka/Rabbit) instead of HTTP.

