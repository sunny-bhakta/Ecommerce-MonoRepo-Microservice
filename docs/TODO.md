## TODO: migrations / SQLAlchemy notes

- If we switch notifications storage to a relational DB, add SQLAlchemy models and Alembic migrations.
- For Mongo (current implementation), consider adding migration-like seed/cleanup scripts if collection shapes change.
- Should we include migrations?
-  Real providers for notifications:
Email: use a transactional provider (e.g., SendGrid/Mailgun/SES) or just SMTP?
SMS: Twilio (already hinted) or another provider?
Webpush: integrate VAPID + real push delivery
  - Add envs: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_EMAIL
  - Add dependency: pywebpush
  - Store registrations with userId, endpoint, p256dh, auth, createdAt/updatedAt
  - On POST /notifications (channel=webpush): load registrations (optionally by userId) and call webpush(...) with VAPID keys; handle WebPushException and delete stale (410/404) endpoints
  - Keep current registration payload `{endpoint, p256dh, auth}`; optionally accept userId
  - Payload suggestion: include title/body/metadata and default icon/link for clients

- Logger
  - structured fields (user, order/product IDs, amounts, queue names) logger
  - Add a microservice message interceptor for RMQ once queues are enabled.
  - Extend domain-event logging to other services’ critical paths.

- Add shipping address in checkout, make it dynamic

- search:
  - add product/category data in search in realtim

- analytic:
  - add realtime analytics data