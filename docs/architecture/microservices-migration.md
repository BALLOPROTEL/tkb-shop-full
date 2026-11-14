# TKB Shop - Microservices migration

## Goal

Migrate the current FastAPI monolith without breaking the React frontend or production data.

## Strategy: strangler pattern

The frontend keeps one API base URL. The API Gateway receives every `/api/*` request and routes each bounded context to its owner.

### Current routing

```text
React frontend
     |
     v
API Gateway :8000
     |
     +---- /api/products* --------------------------> Catalog
     |
     +---- /api/auth/*
     +---- /api/users/me
     +---- /api/admin/invites* ---------------------> Auth
     |
     +---- /api/orders*\n     +---- /api/admin/orders --------------------------> Orders\n     |\n     +---- /api/payments* ---------------------------> Payments\n     |       |\n     |       +---- internal payment completed ---------> Orders\n     |\n     +---- Auth ---- internal email -----------------> Notifications\n     |\n     +---- /api/settings\n     +---- /api/newsletter\n     +---- /api/admin/newsletter\n     +---- /api/admin/stats --------------------------> Backoffice\n     |\n     +---- unknown /api/* ----------------------------> 404
```

### Completed

- API Gateway introduced.
- Catalog service extracted.
- Auth / Users service extracted.
- Legacy backend containerized.
- Shared MongoDB intentionally retained during the strangler phase.
- CI validates frontend build, Python syntax and service tests.
- insecure hard-coded JWT fallback removed.

## Target bounded contexts

### Auth service
Owns users, login, JWT issuance, profile, password reset and admin invitations.

### Catalog service
Owns products, categories, stock-read model and product administration.

### Orders service
Will own quote validation, order creation, order lifecycle and order history.

### Payments service
Will own Stripe and PayPal integrations, webhook verification and payment state.

### Notifications service
Will own transactional email and asynchronous notifications. Auth still sends its email directly until this extraction.

### Backoffice service
Owns global site settings, newsletter subscriptions/listing and administrative aggregate statistics.

## Data migration target

The current shared MongoDB is transitional, not the target architecture.

For each domain:
1. move route ownership,
2. stabilize API contract,
3. add tests,
4. move collection/database ownership,
5. disable equivalent legacy route,
6. preserve a rollback path.

## Events

After Orders and Payments are extracted, introduce a broker only for valuable asynchronous flows. Candidate events:

- `order.created`
- `payment.completed`
- `order.status.changed`
- `stock.changed`
- `user.registered`

Do not add a broker merely to make the architecture look distributed.

## Security rules

- no hard-coded JWT fallback secret,
- secrets from environment/platform secret stores,
- only the Gateway public in the final topology,
- service-to-service authentication before final production cutover,
- payment webhook signature verification is mandatory.

## Definition of done for each extraction

- frontend contract unchanged or versioned,
- health endpoint,
- unit/API smoke tests,
- CI green,
- Gateway routes the bounded context,
- legacy implementation can be disabled without regression,
- rollback path documented.


## Phase 2 - Catalog data ownership

Orders no longer reads or mutates the Catalog `products` collection directly.

Internal contracts:
- `POST /internal/catalog/quote` for authoritative pricing and stock validation.
- `POST /internal/catalog/stock/commit` for token-protected idempotent stock decrements.

Catalog owns the idempotency ledger for stock commits. Orders now depends on Catalog's service contract rather than Catalog persistence.


## Phase 2 - Payments and Backoffice data ownership

Payments no longer reads MongoDB user/order collections. It validates the caller JWT locally and obtains the authorized checkout context from Orders through a protected internal contract.

Backoffice keeps only its own settings/newsletter persistence. Administrative statistics are composed from Auth, Catalog and Orders internal stats endpoints, and admin authorization is validated through Auth.

This removes direct cross-domain collection access from Payments and Backoffice.
