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

## TODO / Improvements

1. [ ] **Provider integrations & webhooks**
  - [ ] Implement Razorpay/Stripe webhooks with signature verification.
  - [ ] Handle capture/refund notifications and update payment status accordingly.

2. [ ] **State reconciliation & idempotency**
  - [ ] Store provider payment/order IDs and reconcile periodically.
  - [ ] Add idempotency keys for payment creation + refunds.

3. [ ] **Multi-provider routing**
  - [ ] Abstract provider clients to support routing/fallback.
  - [ ] Add configuration for provider priorities, failover, and regional rules.

4. [ ] **Customer authentication**
  - [ ] Support 3DS/MFA flows where required (redirects, OTP capture).
  - [ ] Expose status fields so the frontend can handle challenge flows.

5. [ ] **Operations & monitoring**
  - [ ] Emit metrics (success rate, latency, provider errors) and set alerts.
  - [ ] Build reconciliation jobs and dashboards for stuck payments/refunds.

