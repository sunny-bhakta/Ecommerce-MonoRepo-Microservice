# Search Service

Purpose: document indexing/search with MongoDB persistence.

- Port: 3120 (default)
- Env:
  - `SEARCH_SERVICE_URL`
  - `MONGODB_URI` (falls back to `MONGO_URL` or `mongodb://0.0.0.0:27017/ecommerce`)
  - `MONGODB_DB` (default: `search`)
- Storage: MongoDB (`search_documents` collection with text index)
- Key endpoints:
  - `GET /health`
  - `POST /index`
  - `POST /seed`
  - `POST /search`
  - `GET /documents/:id`
- Notes: Admin indexes; public search/read; simple `$text` relevance with tag filters stored alongside documents. Documents carry a `type` (`product`, `category`, `general`) plus arbitrary `metadata` blob for frontend cards.

## Sample feed data
- Categories: `Footwear`, `Electronics`, `Home & Decor` – include `slug`, `icon`, and `productCount` metadata with `type: "category"`.
- Products: `Velocity Runner X1`, `Lumina Echo Sneaker`, `Aurora ANC Headphones`, `Polaris Ultrabook 14"`, `Lumen Orbit Table Lamp` – each stores price/currency/vendor/image/rating metadata and `type: "product"`.
- Editorial/general: `Spring Style Edit` campaign card with hero image, featured categories, and CTA in metadata using `type: "general"`.
- Call `POST /search/seed` (admin) to populate these examples or extend `seedDummyData` with catalog feeds for richer demos.



## Extending
- Swap to Elasticsearch/Meilisearch with relevance ranking and pagination.
- Add facets/filters, highlighting, and typo tolerance.
- Add background indexing pipeline fed from catalog/ordering events.
- Expand seed data or wire to catalog events to keep product/category metadata fresh.

## TODO / Improvements

1. [ ] **Search engine upgrade**
  - [ ] Evaluate Elasticsearch/Meilisearch for better ranking, pagination, and scoring.
  - [ ] Migrate indexing/query code to new engine with zero-downtime strategy.

2. [ ] **Rich query capabilities**
  - [ ] Add facets, filters, and highlighting support.
  - [ ] Implement typo tolerance and synonym support for better UX.

3. [ ] **Indexing pipeline**
  - [ ] Build background consumers that ingest catalog/order events to keep the index fresh.
  - [ ] Add reindex tooling and versioned schemas for safe migrations.

4. [ ] **Content freshness**
  - [ ] Wire periodic sync with catalog service to refresh price/inventory metadata.
  - [ ] Expand seed data and provide admin APIs for bulk imports.

5. [ ] **Observability & alerts**
  - [ ] Track indexing lag, query latency, and error rates.
  - [ ] Alert when freshness guarantees are violated.

