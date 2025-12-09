# Review Service

Purpose: product/vendor reviews with rating/comment, flagging, and moderation.

- Port: 3090 (default)
- Env: `REVIEW_SERVICE_URL`, `MONGO_URL` (MongoDB via Mongoose)
- Key endpoints:
  - `GET /health`
  - `POST /reviews`
  - `GET /reviews` (filters: targetId, targetType, status)
  - `PATCH /reviews/:id/flag`
  - `PATCH /reviews/:id/moderate`
- Notes: Stored in Mongo; admin moderation via gateway; auth required for create/flag.

## Extending
- Add aggregation for average ratings per product/vendor and cached summaries.
- Add abuse signals (IP/device rate limits) and richer moderation queues.
- Add media support (images) and helpfulness votes with spam protection.

