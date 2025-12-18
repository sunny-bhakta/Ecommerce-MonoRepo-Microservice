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
  - `POST /products`, `GET /products`, `GET /products/:id`, `PATCH /products/:id`
  - `POST /products/:productId/variants`, `GET /products/:productId/variants`
- Notes: Uses MongoDB via Mongoose; validation via class-validator; admin writes routed through the gateway.

## Extending
- Add indexes (categoryId, sku) and search integration.
- Add pricing rules (discounts, tax classes) and media (images).
- Add slugs/SEO fields and soft-delete/archive for products.

## Variants & Options
- Products can define `options` (array of `{ name, values[] }`). Variant attributes must use only these option names and allowed values.
- Variant option combinations are validated for uniqueness per product.
- Set `CATALOG_USE_VARIANT_COLLECTION=true` to store variants in a dedicated `variants` collection (prefer for products with many variants). Default keeps variants embedded on the product document.
- Updating a product via `PATCH /products/:id` can also replace option definitions; existing variants are normalized against the new definitions and validation will fail if the new options invalidate current variants.

