# TKB Shop — Microservices architecture

## Current state

TKB Shop has completed the application-level migration from a FastAPI monolith to domain-oriented microservices. The React frontend keeps one stable `/api/*` contract and communicates only with the API Gateway.

```text
React
  |
  v
API Gateway
  |
  +--> Catalog ------> tkb_catalog
  |
  +--> Auth ---------> tkb_auth
  |      |
  |      +--> Notifications
  |
  +--> Orders -------> tkb_orders
  |      |
  |      +--> Catalog internal quote / stock contracts
  |      +--> Payments PayPal verification
  |
  +--> Payments
  |      |
  |      +--> Auth identity validation
  |      +--> Orders checkout/payment contracts
  |
  +--> Backoffice ---> tkb_backoffice
         |
         +--> Auth / Catalog / Orders internal stats contracts
```

Unknown API routes return 404. The legacy backend is not part of the runtime.

## Route ownership

### Auth
Owns registration, login/JWT issuance, profile, password reset, administrator invitations and user administration.

### Catalog
Owns products, authoritative prices, stock validation and idempotent stock commits.

### Orders
Owns order creation, quotes orchestration, order history, lifecycle and order/revenue statistics.

### Payments
Owns Stripe and PayPal provider integration. It has no MongoDB persistence and obtains identity/order context through internal service contracts.

### Notifications
Owns SMTP delivery for transactional emails.

### Backoffice
Owns site settings and newsletter persistence. Administrative dashboard statistics are composed from domain-owned internal endpoints.

## Data ownership

Services share MongoDB infrastructure locally, but not a logical database or cross-domain collections.

| Service | Database | Owned data |
| --- | --- | --- |
| Auth | `tkb_auth` | users, password resets, admin invites |
| Catalog | `tkb_catalog` | products, stock commit idempotency ledger |
| Orders | `tkb_orders` | orders |
| Backoffice | `tkb_backoffice` | settings, newsletter |
| Payments | none | provider integration only |
| Notifications | none | transport only |
| Gateway | none | routing only |

CI explicitly fails if foreign domain collections appear in these databases.

## Identity boundary

Auth is the only service that owns user persistence and `JWT_SECRET`.

Catalog, Orders, Payments and Backoffice validate caller identity through:

```text
POST /internal/auth/validate
X-Internal-Token: ...
```

This removes duplicated JWT/user persistence logic from business services.

## Internal contracts

Catalog:
- `POST /internal/catalog/quote`
- `POST /internal/catalog/stock/commit`
- `GET /internal/catalog/stats`

Auth:
- `POST /internal/auth/validate`
- `GET /internal/auth/stats`

Orders:
- `POST /internal/orders/{id}/checkout-context`
- `POST /internal/orders/{id}/payment-completed`
- `GET /internal/orders/stats`

Payments:
- `POST /internal/paypal/verify`

Notifications:
- `POST /internal/email`

Every internal contract requires `INTERNAL_SERVICE_TOKEN`.

## Observability

Every HTTP request carries a correlation identifier.

- Gateway accepts `X-Request-ID` or generates one.
- The same identifier is propagated through downstream/internal calls.
- Every service returns `X-Request-ID`.
- Every service emits JSON request logs containing service, request_id, method, path, status and duration_ms.
- The E2E certification proves one trace ID reaches Gateway, Backoffice, Auth, Catalog and Orders.

## Health semantics

- `/_health`: liveness — process is alive.
- `/ready`: readiness — service can serve traffic.
- Mongo-backed services ping their owned database.
- Gateway readiness aggregates its directly routed dependencies and returns 503 if one is unavailable.

## CI certification

The pipeline validates:

1. frontend build,
2. Python syntax,
3. Gateway tests,
4. Catalog tests,
5. Auth tests,
6. Orders tests,
7. Payments tests,
8. Notifications tests,
9. Backoffice tests,
10. full Docker Compose certification.

The full certification creates an isolated user/product/order/settings/newsletter flow, checks distributed request tracing, checks admin aggregation through service contracts and validates database ownership boundaries.

## Remaining platform work

The architecture migration itself is complete. Remaining work is operational hardening rather than domain extraction: repository branch protection, production deployment topology, secret management, monitoring/alerting and optional broker-based asynchronous events where they provide measurable value.
