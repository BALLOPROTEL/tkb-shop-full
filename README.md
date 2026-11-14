# TKB Shop

TKB Shop is an e-commerce application built with React/Vite and FastAPI/MongoDB.

## Microservices runtime

The frontend keeps a stable `/api/*` contract and talks only to the API Gateway.

Route ownership:

- `gateway`: public API entry point.
- `catalog`: `/api/products*`.
- `auth`: `/api/auth/*`, `/api/users/me`, `/api/admin/invites*`, `/api/admin/users*`.
- `orders`: `/api/orders*`, `/api/admin/orders`.
- `payments`: `/api/payments*`, Stripe and PayPal integrations.
- `notifications`: internal transactional email delivery.
- `backoffice`: settings, newsletter and admin aggregate stats.

Unknown API routes return 404. The legacy FastAPI application is no longer part of the microservices runtime.

## Run locally

1. Copy `.env.microservices.example` to `.env`.
2. Set strong values for `JWT_SECRET` and `INTERNAL_SERVICE_TOKEN`.
3. Run:

```bash
docker compose -f docker-compose.microservices.yml up --build
```

Health endpoints:

- Gateway: http://localhost:8000/_health
- Catalog: http://localhost:8001/_health
- Auth: http://localhost:8002/_health
- Orders: http://localhost:8003/_health
- Payments: http://localhost:8004/_health
- Notifications: http://localhost:8006/_health
- Backoffice: http://localhost:8007/_health

Frontend:

```bash
cd frontend
npm ci
VITE_API_BASE_URL=http://localhost:8000 npm run dev
```

## Certification

The CI includes isolated service tests plus a full Docker Compose certification that exercises the system through the API Gateway.

```bash
JWT_SECRET=local-secret \
INTERNAL_SERVICE_TOKEN=local-internal-secret \
python scripts/certify_microservices.py
```

## Migration status

| Domain | Status |
| --- | --- |
| API Gateway | Active |
| Catalog | Extracted |
| Auth / Users | Extracted |
| Orders | Extracted |
| Payments | Extracted |
| Notifications | Extracted |
| Backoffice | Extracted |
| Legacy runtime | Removed |
| Database ownership split | In progress |
| Observability / resilience | Planned |

See `docs/architecture/microservices-migration.md`.


## Mongo database separation

The microservices runtime uses separate logical databases:

- Auth: `tkb_auth`
- Catalog: `tkb_catalog`
- Orders: `tkb_orders`
- Backoffice: `tkb_backoffice`

Before migrating an existing shared `protel_shop` database, take a backup:

```bash
mongodump --uri="$MONGO_URI" --db=protel_shop --out=./backup-before-microservices
```

Then run the idempotent migration:

```bash
SOURCE_DB=protel_shop \
AUTH_DB=tkb_auth \
CATALOG_DB=tkb_catalog \
ORDERS_DB=tkb_orders \
BACKOFFICE_DB=tkb_backoffice \
mongosh "$MONGO_URI" --file scripts/migrate_shared_mongo_to_service_dbs.js
```

Verify collection counts and run the full certification before changing production traffic. The migration copies data and does not delete the source database, so rollback is performed by restoring the previous service database settings or restoring the `mongodump`.
