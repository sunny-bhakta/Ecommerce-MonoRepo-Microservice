## Environment Variables

Below is a list of common environment variables used by this monorepo. Set these as needed in a `.env` file or your deployment environment.

### Global / Gateway

| Variable                        | Description                                  | Default (if any)                  |
|----------------------------------|----------------------------------------------|------------------------------------|
| `GATEWAY_PORT`                   | Port for API gateway                         | `3000`                             |
| `NODE_ENV`                       | Node environment (`development`, `prod`)     |                                    |

### Service URLs (used by gateway & integration):

| Variable                        | Used For           | Default URL                     |
|----------------------------------|--------------------|---------------------------------|
| `AUTH_SERVICE_URL`               | Auth service       | `http://localhost:3010`         |
| `USER_SERVICE_URL`               | User service       | `http://localhost:3020`         |
| `VENDOR_SERVICE_URL`             | Vendor service     | `http://localhost:3030`         |
| `CATALOG_SERVICE_URL`            | Catalog service    | `http://localhost:3040`         |
| `INVENTORY_SERVICE_URL`          | Inventory service  | `http://localhost:3050`         |
| `ORDER_SERVICE_URL`              | Order service      | `http://localhost:3060`         |
| `PAYMENT_SERVICE_URL`            | Payment service    | `http://localhost:3070`         |
| `SHIPPING_SERVICE_URL`           | Shipping service   | `http://localhost:3080`         |
| `REVIEW_SERVICE_URL`             | Review service     | `http://localhost:3090`         |
| `ANALYTICS_SERVICE_URL`          | Analytics service  | `http://localhost:3100`         |
| `ADMIN_SERVICE_URL`              | Admin service      | `http://localhost:3110`         |
| `SEARCH_SERVICE_URL`             | Search service     | `http://localhost:3120`         |
| `NOTIFICATION_SERVICE_URL`       | Notification       | `http://localhost:3130`         |

### Notification Service (Python/FastAPI)

| Variable            | Description                                         | Default                |
|---------------------|-----------------------------------------------------|------------------------|
| `RABBITMQ_URL`      | RabbitMQ broker URL                                 |                        |
| `EMAIL_PROVIDER_URL`| Outbound email provider base URL                    |                        |
| `SMS_PROVIDER_URL`  | Outbound SMS provider base URL                      |                        |

### Optional / Service-specific

- Each service may also support its own `PORT` (e.g., `USER_PORT`, `ORDER_PORT`)
- Database connection URLs (e.g., `DATABASE_URL` for Postgres/MySQL)
- JWT/secret keys: `AUTH_JWT_SECRET`, `PAYMENT_SECRET_KEY`, etc.

**Tip:** For local dev, copy `.env.example` (if present) and customize as needed.

