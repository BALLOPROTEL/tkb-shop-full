# TKB Shop — Microservices architecture

## Goal

TKB Shop has completed its migration from a FastAPI monolith to a microservices runtime while preserving the frontend `/api/*` contract.

## Runtime topology

```text
React / Vite frontend
        |
        v
API Gateway :8000
        |
        +--> Catalog ---------> tkb_catalog
        |
        +--> Auth ------------> tkb_auth
        |
        +--> Orders ----------> tkb_orders
        |      |
        |      +--> Auth
        |      +--> Catalog
        |
        +--> Payments
        |      |
        |      +--> Auth
        |      +--> Orders
        |
        +--> Notifications
        |
        +--> Backoffice ------> tkb_backoffice
               |
               +--> Auth
               +--> Catalog
               +--> Orders
```

Only the Gateway is intended to be public in the backend topology. Unknown `/api/*` routes return 404; the legacy FastAPI application is no longer part of the microservices runtime.

## Service ownership

### Gateway
Owns public routing, request correlation and aggregated readiness.

### Auth
Owns users, login, JWT issuance and validation, profile, password reset, admin invitations and administrative user operations.

Auth is the exclusive owner of `JWT_SECRET`. Catalog, Orders, Payments and Backoffice delegate identity validation to the protected `POST /internal/auth/validate` contract.

### Catalog
Owns products, pricing, stock and product administration.

Internal contracts include:
- `POST /internal/catalog/quote`
- `POST /internal/catalog/stock/commit`
- `GET /internal/catalog/stats`

Catalog owns stock mutation and its idempotency ledger.

### Orders
Owns quote orchestration, order creation, lifecycle, history and order statistics.

Orders obtains identity from Auth and authoritative product/stock information from Catalog. It does not access Auth or Catalog persistence directly.

### Payments
Owns Stripe/PayPal integrations, webhook verification and payment orchestration.

Payments is persistence-stateless in the application database layer. It validates callers through Auth and obtains order checkout context through Orders.

### Notifications
Owns transactional SMTP email delivery and is called through protected internal service contracts.

### Backoffice
Owns settings and newsletter persistence. Administrative aggregate statistics are composed through Auth, Catalog and Orders internal APIs rather than cross-domain database reads.

## Data ownership

Stateful bounded contexts use separate logical MongoDB databases:

- Auth: `tkb_auth`
- Catalog: `tkb_catalog`
- Orders: `tkb_orders`
- Backoffice: `tkb_backoffice`

The shared `protel_shop` database is legacy source data only and is not used by the microservices runtime.

The migration script `scripts/migrate_shared_mongo_to_service_dbs.js` performs idempotent upserts by `_id` and intentionally leaves the source database untouched for rollback.

Recommended production cutover:

1. create a `mongodump`;
2. run the migration;
3. compare collection/document counts;
4. run the full microservices certification;
5. configure the service-specific database names;
6. retain the source database until the rollback window closes.

## Service-to-service security

Internal endpoints require `INTERNAL_SERVICE_TOKEN`.

Application JWTs are issued and decoded only by Auth. Other services never need the JWT signing secret.

Payment webhook signature verification remains mandatory.

## Observability and resilience

Every HTTP request has a correlation identifier:

- Gateway accepts or generates `X-Request-ID`;
- the same identifier is returned to the client;
- downstream calls propagate it;
- services write structured JSON access logs with service, request_id, method, path, status and duration.

Health semantics:

- `/_health`: liveness;
- `/ready`: readiness;
- Mongo-backed services verify database connectivity;
- Gateway aggregates readiness of its direct dependencies.

## CI and certification

CI contains ten required checks:

- Frontend build
- Python syntax
- Gateway tests
- Catalog tests
- Auth tests
- Orders tests
- Payments tests
- Notifications tests
- Backoffice tests
- Microservices certification

The Docker certification validates the assembled stack through the Gateway and verifies service/database boundaries.

## Migration result

The strangler migration is complete:

- all business routes are owned by microservices;
- legacy runtime fallback is removed;
- cross-domain collection access is removed;
- stateful domains are physically separated into logical databases;
- Auth is the sole JWT authority;
- internal contracts are token-protected;
- liveness, readiness and request correlation are implemented;
- the complete stack is CI-certified.

Production deployment of the distributed backend remains an environment/platform operation rather than an architecture migration task.
