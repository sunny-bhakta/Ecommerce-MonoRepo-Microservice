# Admin Service

Purpose: track admin actions (moderation, refunds, approvals).

- Port: 3110 (default)
- Env: `ADMIN_SERVICE_URL`
- Storage: in-memory
- Key endpoints:
  - `GET /health`
  - `POST /admin/actions`
  - `GET /admin/actions` (filters: status, targetType)
  - `PATCH /admin/actions/:id`
- Notes: Admin-only via gateway; consider persistence later.

## Extending
- Persist actions and add audit trail/history.
- Add SLAs, assignment (owner), and notifications on status changes.
- Integrate with review/payment/order systems for linked workflows.

