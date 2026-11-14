# Payments service

Owns TKB Shop payment-provider integrations.

Public routes:
- `POST /api/payments/create-stripe-session`
- `POST /api/payments/stripe-webhook`

Internal routes:
- `POST /internal/paypal/verify`

Orders calls the PayPal verification endpoint with `X-Internal-Token`.
After a verified Stripe webhook, Payments calls the idempotent Orders internal payment-completed endpoint.

During the strangler phase Payments still reads users/orders from the shared MongoDB database to authorize Stripe session creation. Data ownership is separated in a later platform phase.
