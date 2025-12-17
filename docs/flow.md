# Customer Flow: Login → Checkout → Payment → Order Lifecycle

This document explains how a shopper moves through the system—from authentication to order creation, payment, and fulfilment—using the API gateway to orchestrate downstream services.

## Actors / Services
- Client (web/app)
- API Gateway (auth guard + orchestration)
- Auth service (JWT issuance/validation)
- Catalog service (products/pricing)
- Inventory service (stock check/reserve)
- Order service (order records + status)
- Payment service (attempts/refunds)
- Shipping service (shipments + tracking)
- Notification service (email/SMS/webpush)
- Analytics service (event ingestion)

## High-Level Sequence
```
Client            Gateway          Auth        Catalog/Inventory     Order           Payment          Shipping       Notification   Analytics
  |  login         |               |                |                  |               |                 |                |             |
  | POST /auth/login|--> validate ->|                |                  |               |                 |                |             |
  |<-- JWT token   |               |                |                  |               |                 |                |             |
  | browse/add to cart (GET /catalog, optional stock checks)                                             |                |             |
  | checkout POST /checkout (items, shipping addr, payment method)                                        |                |             |
  |---------------->| auth guard ->|                | price + stock -> | create order  |                 |                | ingest evt  |
  |                 |              |                | reserve stock?   | status=pending|                 |                | checkout    |
  |                 |              |                |                  |-------------->| create payment  |                |             |
  |                 |              |                |                  |<--------------| status=initiated|                | ingest evt  |
  |<-- order+payment summary       |                |                  |               |                 |                |             |
  | confirm payment (e.g., client completes 3DS)                     |               |                 |                |             |
  |<-- webhook/polling ----------- |                |                  | update status | update status   | create shipment| send notif  | ingest evt
  | track order   GET /orders/:id/summary --------------------------->| aggregates order + payments + shipment status                               |
```

## Step-by-Step Flow
1) **Login / Register**
   - Client calls `POST /auth/login` (via gateway) with credentials.
   - Auth service returns JWT; gateway does not store state. Client keeps the token.
   - All later calls include `Authorization: Bearer <token>`.

2) **Browse & Cart**
   - Client queries `GET /catalog/*` for products/variants and pricing.
   - Optional: client asks gateway to check stock (`GET /inventory/:sku`) before adding to cart.
   - Cart can be client-side or a thin cart service; checkout payload sends the final item list.

3) **Checkout Request**
   - Client submits `POST /checkout` with:
     - `items` (sku, qty, price/amount optional—gateway can recalc),
     - `shippingAddress` (id or full address),
     - `paymentMethod` (token/id or provider type),
     - `currency`.
   - Gateway auth guard verifies JWT via `AUTH_SERVICE_URL/auth/me` and injects `userId`.
   - Gateway validates payload, can re-price via catalog, and can optionally reserve inventory to avoid oversell.

4) **Order Creation**
   - Gateway calls Order service `/orders` with user, items, totals, and shipping address.
   - Order is created with `status=pending` (or `awaiting_payment`) and an `orderId`.

5) **Payment Attempt**
   - Gateway calls Payment service `/payments` with `orderId`, `amount`, `currency`, and payment method reference.
   - Payment returns `status` (`initiated|succeeded|failed|requires_action`) plus `paymentId`.
   - Gateway returns both order + payment payloads to the client with `nextSteps` guidance.

6) **Payment Confirmation**
   - If the provider requires user action (3DS, OTP), the client completes it and the Payment service updates status via callback/webhook.
   - On `succeeded`, gateway (or payment webhook handler) updates Order to `paid` and records transaction details.
   - On `failed`, Order can stay `pending` and inventory can be released; client may retry payment.

7) **Shipping & Address Handling**
   - The shipping address captured at checkout is stored on the order.
   - On successful payment, a Shipment is created (`POST /shipments`) referencing `orderId`, carrier, and destination; status starts as `label_pending` or `processing`.
   - Shipping status transitions (`processing -> in_transit -> delivered`) are updated via `/shipments/:id/status`.

8) **Notifications & Analytics**
   - Notification service sends email/SMS/webpush for order confirmation, payment receipt, and shipping updates.
   - Analytics service ingests events (`checkout_initiated`, `order_created`, `payment_succeeded`, `shipment_updated`) for dashboards.

9) **Order Tracking**
   - Client fetches `GET /orders/:orderId/summary` to see aggregated order, payment attempts, and shipment status in one response.

## Key State Transitions
- **Order:** `pending/awaiting_payment` → `paid` → `fulfillment` → `shipped` → `delivered` (or `cancelled` on payment failure/release).
- **Payment:** `initiated` → `requires_action` → `succeeded` | `failed` | `refunded`.
- **Inventory (optional):** `reserved` → `allocated` on payment success, or `released` on failure/cancel.

## Failure & Retry Notes
- Auth failures return 401 from gateway guards; client should re-login.
- Payment failures keep the order pending; retry with a new payment method.
- If inventory reservation fails, gateway returns 409/422 and no order is created.
- Gateway wraps upstream errors as `502 Bad Gateway` with upstream details to aid debugging.
