# Gateway Orchestration Overview

This document explains how the API gateway orchestrates and proxies all downstream services (auth, user, vendor, catalog, inventory, order, payment, shipping, search, review, analytics, admin, notification). It lists configuration, health behaviour, and available REST endpoints exposed via the gateway.

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

## Resilience configuration (circuit breakers & retries)

`GatewayHttpService` now wraps every downstream request in a per-service retry/backoff policy plus a lightweight circuit breaker:

| Env var | Default | Purpose |
| --- | --- | --- |
| `GATEWAY_HTTP_DEFAULT_RETRY_ATTEMPTS` | `2` | Global retry count before surfacing the upstream error. |
| `GATEWAY_HTTP_DEFAULT_RETRY_DELAY_MS` | `200` | Base delay (ms) between retries, multiplied by the attempt number for linear backoff. |
| `GATEWAY_HTTP_DEFAULT_CIRCUIT_THRESHOLD` | `5` | Number of consecutive retryable failures before the circuit opens. |
| `GATEWAY_HTTP_DEFAULT_CIRCUIT_COOLDOWN_MS` | `10000` | Cooldown (ms) before the circuit half-opens and allows traffic again. |

Per-service overrides adopt the pattern `GATEWAY_HTTP_<SERVICE>_RETRY_ATTEMPTS`, `..._RETRY_DELAY_MS`, `..._CIRCUIT_THRESHOLD`, `..._CIRCUIT_COOLDOWN_MS` (e.g., `GATEWAY_HTTP_PAYMENT_RETRY_ATTEMPTS=5`). When a circuit is open the gateway short-circuits the call with a `503` response that includes the retry-after timestamp, preventing cascading failures.

## Request telemetry & structured logging

Every gateway request now emits an OpenTelemetry span and a structured JSON log entry enriched with the correlation ID and authenticated user metadata. Key points:

- Spans are started in a global tracing interceptor and capture the HTTP method, route, status code, latency, client IP, and end-user identifiers. Failures are recorded with exception details so downstream traces line up with the gateway entry span.
- Logs are produced by the HTTP logging interceptor as JSON objects (`type`, `method`, `path`, `statusCode`, `durationMs`, `correlationId`, `traceId`, `spanId`, `user`). This makes it trivial to feed the output into ELK/Datadog and correlate with traces.
- Correlation IDs still flow via the `x-request-id` header, but the log payload now also exposes the current `traceId`/`spanId` so you can pivot directly into the trace backend.

### Telemetry configuration

| Env var | Default | Notes |
| --- | --- | --- |
| `OTEL_ENABLED` | `true` | Global kill switch for all telemetry. Set `false` to disable without code changes. |
| `GATEWAY_TELEMETRY_ENABLED` | `true` | Gateway-specific toggle checked before bootstrapping the tracer. |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | `http://localhost:4318/v1/traces` | OTLP/HTTP collector URL. Point this at Tempo, Jaeger, New Relic, etc. |
| `OTEL_EXPORTER_OTLP_HEADERS` | _(empty)_ | Optional headers (`key=value,key2=value2` or JSON) sent with every OTLP call for auth. |
| `OTEL_SERVICE_NAMESPACE` | `ecommerce-platform` | Overrides the namespace/resource attribute. |
| `OTEL_SERVICE_INSTANCE_ID` | `<hostname>` | Useful when running multiple gateway replicas. |

Shut down signals (`SIGINT`, `SIGTERM`) now drain the tracer SDK cleanly. If no collector is reachable the gateway still boots; telemetry failures are logged once on startup.

> Tip: When combined with the resilience metrics above you can chart retry/circuit activity per trace by filtering on the `custom.correlation_id` or `enduser.id` attributes.

## Code and folder structure

The gateway lives in `apps/gateway/src` and mirrors the downstream bounded contexts so changes stay localized:

| Path | Purpose |
| --- | --- |
| `main.ts` | Boots the HTTP server via `bootstrapHttpService`, which wires telemetry, request context middleware, and global interceptors/filters. |
| `app.module.ts` | Central Nest module that registers shared providers (`GatewayHttpService`, config, clients) and imports each feature module. |
| `controllers/` | One controller per domain (`orders.controller.ts`, `payments.controller.ts`, etc.). Each file exposes REST endpoints that orchestrate downstream calls, always delegating to the matching service. |
| `services/` | Domain-specific orchestrators (e.g., `orders.service.ts`) plus shared helpers such as `gateway-http.service.ts` (resilience, request fan-out) and `auth-client.service.ts` (JWT validation). Includes `__tests__/` for focused unit specs. |
| `guards/` & `decorators/` | Gateway-specific auth utilities (`GatewayAuthGuard`, `RolesGuard`, `@CurrentUser`) applied across controllers. |
| `dto/` & `interfaces/` | Request/response DTOs and common TypeScript contracts (`AuthenticatedUser`, aggregation shapes) used by controllers and services. |
| `constants/` | Centralized magic strings (routing prefixes, cache keys) so they remain consistent across controllers. |

Cross-cutting utilities (bootstrapping, structured logging, interceptors, telemetry, request context) reside in `libs/common/src` and are shared by all services. Updating that library automatically benefits the gateway after a rebuild.

## Improvement points

1. **Circuit breakers & retries per downstream** – ✅ Implemented via `GatewayHttpService` (see the resilience configuration section) with configurable backoff + circuit breakers per service.
2. **Request-scoped telemetry** – ✅ Gateway spans + structured logs now emit trace/span IDs, correlation IDs, and user context for every request. Next step is to propagate the same setup to downstream services and wire dashboards.
3. **Read-through caching for hot endpoints** – Catalog/search/listing GETs are fanned out each time. Applying a short TTL cache (Redis or in-memory) at the gateway for read-heavy routes would cut latency and downstream load.
4. **Fan-out aggregations for payments/shipments** – Checkout returns order+payment, but order detail endpoints still make sequential calls. Parallelizing those aggregations and unifying error handling would improve P95 latency.
5. **Contract / e2e coverage** – Only unit-style helpers are tested today. Adding Pact-style contract tests or e2e suites (e.g., via `@nestjs/testing` + mocked downstreams) would prevent regressions across controllers.
6. **Security** – Harden rate limiting/abuse detection at the gateway (per-route throttles, anomaly detection) and ensure PII masking in structured logs once telemetry work lands.
7. **Swagger**
8. **Code and folder structure** – ✅ Documented above so new contributors can quickly navigate the controllers/services layout and shared libs. Future improvements could include per-module READMEs or diagram links.
## TODO

- [x] Implement per-service retry/backoff + circuit breaker settings inside `GatewayHttpService` (surface via config).
- [x] Add OpenTelemetry tracing + structured logs (correlation IDs, user info) for every gateway request.
- [ ] Introduce Redis-backed caches for catalog/search GET routes with explicit invalidation hooks.
- [ ] Parallelize aggregation endpoints (order summary, analytics metrics) and tighten timeout budgets.
- [ ] Add gateway-focused contract/e2e tests that stub downstream services and validate controller behaviors.
- [ ] Security
- [ ] Code and folder structure
- [ ] Swagger
