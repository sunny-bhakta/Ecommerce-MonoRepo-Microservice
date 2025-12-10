# Catalog Service

Purpose: manage categories, products, and variants (attributes, SKU/price/stock pointers).

- Port: 3040 (default)
- Env:
  - `MONGODB_URI` (default: `mongodb://0.0.0.0:27017/ecommerce`)
  - `MONGODB_DB` (default: `catalog`)
  - `CATALOG_SERVICE_URL` for gateway to call this service
- Key endpoints:
  - `GET /health`
  - `POST /categories`, `GET /categories`
  - `POST /products`, `GET /products`, `GET /products/:id`
  - `POST /products/:productId/variants`, `GET /products/:productId/variants`
- Notes: Uses MongoDB via Mongoose; validation via class-validator; admin writes routed through the gateway.

## Extending
- Add indexes (categoryId, sku) and search integration.
- Add pricing rules (discounts, tax classes) and media (images).
- Add slugs/SEO fields and soft-delete/archive for products.

