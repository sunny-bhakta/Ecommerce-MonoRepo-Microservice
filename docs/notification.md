# Notification Service (Python)

Purpose: send notifications (email, sms, webpush) and register webpush endpoints.

- Port: 3130 (default)
- Env: `NOTIFICATION_SERVICE_URL`, `RABBITMQ_URL`, `EMAIL_PROVIDER_URL`, `SMS_PROVIDER_URL`, `MONGO_URL`
- Storage: MongoDB via Motor (notifications, webpush_registrations)
- Key endpoints (prefixed by gateway when proxied):
  - `GET /notifications/health`
  - `POST /notifications`
  - `POST /notifications/webpush/register`
- Notes: FastAPI service; future work—add VAPID push delivery and provider integration.

## Extending
- Add VAPID keys and real webpush delivery (pywebpush) with stale endpoint cleanup.
- Integrate real email/SMS providers; add retries/DLQ.
- Add templates and per-channel rate limiting.

## TODO / Improvements

1. [ ] **Provider integrations**
  - [ ] Configure real email (SendGrid/Mailgun/SES) and SMS (Twilio/etc.) providers with retries + DLQ.
  - [ ] Store provider message IDs for reconciliation and delivery tracking.

2. [ ] **Webpush enhancements**
  - [ ] Manage VAPID keys via env/config and support pywebpush delivery.
  - [ ] Clean up stale registrations automatically when providers return 404/410.

3. [ ] **Template & localization system**
  - [ ] Introduce template storage with variables per channel.
  - [ ] Support localization/timezone-aware scheduling.

4. [ ] **Rate limiting & compliance**
  - [ ] Add per-channel/per-user rate limits with configurable quotas.
  - [ ] Implement unsubscribe/opt-out tracking to comply with email/SMS regulations.

5. [ ] **Observability & ops**
  - [ ] Emit metrics (success/failure latencies) and add alerting for provider outages.
  - [ ] Build replay tooling for failed notifications.

