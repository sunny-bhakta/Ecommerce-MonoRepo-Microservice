# Catalog Service

Purpose: manage categories, products, and variants (attributes, SKU/price/stock pointers).

- Port: 3040 (default)
- Env: `CATALOG_SERVICE_URL` for gateway, `MONGO_URL` not used (in-memory for now)
- Key endpoints:
  - `GET /health`
  - `POST /categories`, `GET /categories`
  - `POST /products`, `GET /products`, `GET /products/:id`
  - `POST /products/:productId/variants`, `GET /products/:productId/variants`
- Notes: In-memory storage; validation via class-validator; guarded by gateway for admin writes.

## Extending
- Persist categories/products/variants in Mongo or SQL; add search indexes.
- Add pricing rules (discounts, tax classes) and media (images).
- Add slugs/SEO fields and soft-delete/archive for products.
# Catalog Service

Purpose: manage categories, products, and variants (attributes, SKU/price/stock pointers).

- Port: 3040 (default)
- Env: `CATALOG_SERVICE_URL` for gateway, `MONGO_URL` not used (in-memory for now)
- Key endpoints:
  - `GET /health`
  - `POST /categories`, `GET /categories`
  - `POST /products`, `GET /products`, `GET /products/:id`
  - `POST /products/:productId/variants`, `GET /products/:productId/variants`
- Notes: In-memory storage; validation via class-validator; guarded by gateway for admin writes.

## Extending
- Persist categories/products/variants in Mongo or SQL; add search indexes.
- Add pricing rules (discounts, tax classes) and media (images).
- Add slugs/SEO fields and soft-delete/archive for products.

