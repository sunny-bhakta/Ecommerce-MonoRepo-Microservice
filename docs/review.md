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

## TODO / Improvements

1. [ ] **Aggregations & caching**
  - [ ] Build aggregation jobs for product/vendor average ratings and expose cached summaries.
  - [ ] Provide APIs for top-rated items and rating histograms.

2. [ ] **Abuse & moderation tooling**
  - [ ] Implement IP/device rate limiting + anomaly detection.
  - [ ] Extend moderation queue with prioritization, assignments, and SLA tracking.

3. [ ] **Media & rich content**
  - [ ] Allow photo/video uploads with storage + CDN integration.
  - [ ] Add sanitization for rich text/markdown content.

4. [ ] **Community signals**
  - [ ] Introduce helpful votes / reactions with spam protection.
  - [ ] Surface verified purchase badges via order service integration.

5. [ ] **Search & discovery**
  - [ ] Add indexing hooks so reviews sync to the search service.
  - [ ] Enable filtering by rating, vendor, media presence, or moderation status.

