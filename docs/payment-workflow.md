# Checkout-to-Payment Workflow

This file explains the end-to-end flow from checkout to a completed payment, the services involved, and the client steps for Razorpay and Stripe.

## High-level sequence
1) Client calls `POST /checkout` on the gateway (auth required).
2) Gateway creates the order via Order service (`/orders`) and emits `order.created`.
3) Payment service auto-creates a payment for that order (idempotent, unique per `orderId`) and enqueues provider order/intent creation.
4) Client fetches payment state via gateway `GET /orders/{orderId}/payments` (preferred) or direct `GET http://localhost:3070/payment?orderId=...`.
5) Client completes payment with provider (Razorpay or Stripe) using fields from the payment record.
6) Provider webhooks update the payment to `succeeded` or `failed`; client polls until terminal state.

## Data you read after checkout
- `status`: `processing | pending | succeeded | failed`
- `provider`: `razorpay | stripe`
- `gatewayOrderId`: Razorpay order id (use in Razorpay Checkout)
- `gatewayPaymentId` / `metadata.stripeClientSecret`: Stripe payment intent id / client secret

## Client-side flows
### Razorpay
1) Fetch payment; get `gatewayOrderId`, amount, currency.
2) Open Razorpay Checkout with `order_id = gatewayOrderId`.
3) After user completes, show “processing” and poll `GET /orders/{orderId}/payments` every few seconds.
4) When `status` becomes `succeeded`, show receipt; if `failed`, offer retry.

### Stripe
1) Fetch payment; read `metadata.stripeClientSecret`.
2) Call `stripe.confirmCardPayment(clientSecret, { payment_method: ... })` in the browser.
3) Show “processing” and poll `GET /orders/{orderId}/payments` until `succeeded` or `failed`.
4) On `succeeded`, show receipt; on `failed`, surface error and retry option.

## Idempotency and duplicates
- Payment service enforces a unique constraint on `orderId` and catches unique-violation errors.
- HTTP `POST /payment/payments` and `order.created` handler both return/skip if a payment already exists for the order.

## Useful endpoints
- Checkout: `POST http://localhost:3000/checkout`
- Payments for an order (gateway): `GET http://localhost:3000/orders/{orderId}/payments`
- Payment detail (service): `GET http://localhost:3070/payment?orderId={orderId}`
- Webhooks (server-side only):
  - Razorpay: `POST http://localhost:3070/payment/webhooks/razorpay`
  - Stripe:   `POST http://localhost:3070/payment/webhooks/stripe`

## Minimal happy-path test (local)
1) `POST /checkout` via gateway with a valid token → capture `orderId`.
2) `GET /orders/{orderId}/payments` → capture `gatewayOrderId` (Razorpay) or client secret (Stripe).
3) Complete payment via provider UI/SDK.
4) Poll `GET /orders/{orderId}/payments` until `status = succeeded`.




