# Gateway Orchestration Overview

This document explains how the API gateway orchestrates checkout requests across the existing microservices (order + payment + user profile) and enforces authentication via the auth service. It covers the new REST endpoints, configuration knobs, and runtime behaviour so that other developers can extend the flow safely.

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

## Configuration

The gateway resolves downstream service URLs via environment variables. Each variable accepts a full HTTP base URL (host + port) for the service.

| Service | Env Var | Default |
|---------|---------|---------|
| Order   | `ORDER_SERVICE_URL`   | `http://localhost:3060` |
| Payment | `PAYMENT_SERVICE_URL` | `http://localhost:3070` |
| User    | `USER_SERVICE_URL`    | `http://localhost:3020` |
| Auth    | `AUTH_SERVICE_URL`    | `http://localhost:3010` |

These defaults match the Nest microservice ports configured in `apps/order/src/main.ts` and `apps/payment/src/main.ts`.

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

## User Edge APIs

- `POST /users` proxies profile creation to the user service.
- `GET /users`, `GET /users/:id`, `PATCH /users/:id`, `DELETE /users/:id` expose read/update/delete functionality without coupling clients to the downstream URL.
- Payload validation lives in `apps/gateway/src/dto/user-profile.dto.ts` so requests are filtered before hitting downstream services.
- Customers can manage their own profile via `GET /me/profile` and `PATCH /me/profile`, which proxy to `GET/PATCH /users/:id` using the authenticated principal.

## Extending the Flow

To add another downstream service (e.g., shipping):

1. Update the `DownstreamService` union and `DEFAULT_SERVICE_URLS` map in `apps/gateway/src/app.service.ts`.
2. Add a new env var name following the `<SERVICE>_SERVICE_URL` convention.
3. Register new controller endpoints that leverage the existing HTTP helper methods.

This keeps the gateway focused on orchestration logic while downstream services own their respective domains.
