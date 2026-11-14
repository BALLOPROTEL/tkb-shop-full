# Orders service

Owns the TKB Shop order lifecycle HTTP contract.

Public routes:
- `GET /api/orders/my-orders`
- `GET /api/admin/orders`
- `POST /api/orders`
- `POST /api/orders/quote`
- `PUT /api/orders/{id}/status`

Internal route:
- `POST /internal/orders/{id}/payment-completed`

PayPal provider verification is delegated to Payments. Stripe completion arrives from Payments through the internal idempotent endpoint.

During the strangler phase Orders still reads users/products and mutates product stock through shared MongoDB. Catalog data ownership will be decoupled later.
