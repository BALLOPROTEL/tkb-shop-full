# TKB Shop

TKB Shop is an e-commerce application with a React/Vite frontend and a FastAPI microservices backend.

## Architecture

The frontend keeps a single `/api/*` contract and talks only to the API Gateway.

| Service | Responsibility | Persistence |
| --- | --- | --- |
| Gateway | Single public API entry point, routing, request correlation, aggregated readiness | Stateless |
| Auth | Users, login, JWT issuance/validation, profile, password reset, admin invitations | `tkb_auth` |
| Catalog | Products, pricing, stock, product administration | `tkb_catalog` |
| Orders | Quote orchestration, order lifecycle, history, order statistics | `tkb_orders` |
| Payments | Stripe/PayPal integration, webhooks, payment orchestration | Stateless |
| Notifications | Transactional SMTP email delivery | Stateless |
| Backoffice | Settings, newsletter and aggregate administration statistics | `tkb_backoffice` |

Auth is the exclusive JWT authority. Other services validate identity through the protected internal Auth contract rather than sharing the JWT secret.

Stateful bounded contexts use separate logical MongoDB databases and do not read another domain's collections directly.

## Local development

1. Copy the example environment file:

```bash
cp .env.microservices.example .env
```

2. Replace the placeholder secrets, especially `JWT_SECRET` and `INTERNAL_SERVICE_TOKEN`.

3. Start the stack:

```bash
docker compose -f docker-compose.microservices.yml up --build
```

Frontend:

```bash
cd frontend
npm ci
VITE_API_BASE_URL=http://localhost:8000 npm run dev
```

## Health and readiness

| Service | Liveness |
| --- | --- |
| Gateway | http://localhost:8000/_health |
| Catalog | http://localhost:8001/_health |
| Auth | http://localhost:8002/_health |
| Orders | http://localhost:8003/_health |
| Payments | http://localhost:8004/_health |
| Notifications | http://localhost:8006/_health |
| Backoffice | http://localhost:8007/_health |

Every service also exposes `/ready`. Mongo-backed services verify database connectivity, while Gateway readiness aggregates its direct dependencies.

## Observability

All services emit structured JSON access logs with:

- service name
- `request_id`
- HTTP method and path
- response status
- request duration

Gateway accepts or generates `X-Request-ID`, returns it to the caller and propagates it through internal service calls.

## CI and certification

The protected `main` branch requires these checks before merge:

1. Frontend build
2. Python syntax
3. Gateway tests
4. Catalog tests
5. Auth tests
6. Orders tests
7. Payments tests
8. Notifications tests
9. Backoffice tests
10. Microservices certification

The full certification starts the Docker Compose stack, waits for liveness/readiness and exercises the application through the Gateway.

Run it locally with:

```bash
JWT_SECRET=local-secret \
INTERNAL_SERVICE_TOKEN=local-internal-secret \
python scripts/certify_microservices.py
```

## Migration status

| Domain | Status |
| --- | --- |
| API Gateway | Complete |
| Catalog | Complete |
| Auth / Users | Complete |
| Orders | Complete |
| Payments | Complete |
| Notifications | Complete |
| Backoffice | Complete |
| Legacy runtime removal | Complete |
| Cross-domain persistence removal | Complete |
| Physical MongoDB separation | Complete |
| Auth as exclusive JWT authority | Complete |
| Observability / readiness | Complete |
| End-to-end microservices certification | Complete |

The repository architecture is migration-complete and CI-certified. Deployment of the distributed backend to a production platform is a separate operational step and must be validated per environment.

## Existing-data migration

Before migrating an existing shared `protel_shop` database, create a backup:

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

The migration keeps the source database intact so the rollback window remains available.

For the detailed architecture and migration decisions, see `docs/architecture/microservices-migration.md`.
