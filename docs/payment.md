# Payment Service

Purpose: payment initiation, retries, refund flows; Razorpay provider stub; emits payment events.

- Port: 3070 (default)
- Env: `PAYMENT_SERVICE_URL`, payment provider keys, DB via TypeORM
- Queues: BullMQ retry/DLQ
- Key endpoints:
  - `GET /payments/health`
  - `POST /payments` (create)
  - `GET /payments` (filters: userId, orderId)
  - `GET /payments/:id`
  - `POST /payments/:id/refund`
  - `GET /payments/:id/refunds`
- Notes: Processes `OrderCreatedEvent`; retries with backoff; emits success/failure.

## Extending
- Add provider webhooks (capture/refund events) and signature verification.
- Persist provider IDs and reconcile states; add idempotency keys.
- Support multiple providers with routing/fallback; add 3DS/MFA flows where required.

