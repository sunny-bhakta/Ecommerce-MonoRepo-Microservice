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

## TODO / Improvements

1. [ ] **Durable event storage & rollups**
  - [ ] Choose a persistence layer (Timescale/Postgres or ClickHouse) and capture raw events.
  - [ ] Schedule rollups for GMV/AOV/payment attempts with hourly/daily granularity.

2. [ ] **Event ingestion pipeline**
  - [ ] Add Kafka/Rabbit consumer to ingest events instead of HTTP-only ingest.
  - [ ] Implement dead-letter/retry handling for malformed events.

3. [ ] **Dashboards & APIs**
  - [ ] Expose richer `/analytics/metrics` filters (by service, date range, channel).
  - [ ] Add funnel/retention/cohort endpoints powering frontend dashboards.

4. [ ] **Data governance**
  - [ ] Define schemas/contracts for event payloads and enforce validation.
  - [ ] Add PII scrubbing/anonymization policies before storing events.

5. [ ] **Operations & monitoring**
  - [ ] Add alerting when ingestion or rollups fall behind.
  - [ ] Export metrics (Prometheus/OpenTelemetry) for processing lag and error rates.

