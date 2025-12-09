# Search Service

Purpose: simple document index/search (placeholder).

- Port: 3120 (default)
- Env: `SEARCH_SERVICE_URL`
- Storage: in-memory
- Key endpoints:
  - `GET /health`
  - `POST /index`
  - `POST /search`
  - `GET /documents/:id`
- Notes: Admin indexes; public search/read; consider moving to Elasticsearch/Meilisearch later.

## Extending
- Swap to Elasticsearch/Meilisearch with relevance ranking and pagination.
- Add facets/filters, highlighting, and typo tolerance.
- Add background indexing pipeline fed from catalog/ordering events.

