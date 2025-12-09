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

