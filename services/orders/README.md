# Orders service

Owns the TKB Shop order lifecycle HTTP contract.

Current routes:
- `GET /api/orders/my-orders`
- `GET /api/admin/orders`
- `POST /api/orders`
- `POST /api/orders/quote`
- `PUT /api/orders/{id}/status`

During the strangler phase it still reads users/products and updates product stock through the shared MongoDB database. This coupling is temporary.

PayPal verification is also temporarily kept here to preserve the checkout contract. It will move to Payments when that service is extracted.
