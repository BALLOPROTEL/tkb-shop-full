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
- `backoffice`: settings, newsletter and administrative aggregate stats.

Unknown API routes return 404. The legacy FastAPI application is no longer part of the runtime.

## Data ownership

All stateful domains use separate MongoDB database namespaces:

- Auth: `tkb_auth`
- Catalog: `tkb_catalog`
- Orders: `tkb_orders`
- Backoffice: `tkb_backoffice`

Auth is the only service that owns `JWT_SECRET` and user persistence. Other services validate identities through Auth's token-protected internal contract.

Catalog owns product/stock persistence. Orders uses Catalog contracts for quotes and idempotent stock commits. Payments owns no MongoDB persistence. Backoffice stores only settings/newsletter data and composes stats through service contracts.

## Run locally

1. Copy `.env.microservices.example` to `.env`.
2. Set strong values for `JWT_SECRET` and `INTERNAL_SERVICE_TOKEN`.
3. Run:

```bash
docker compose -f docker-compose.microservices.yml up --build
```

Liveness / readiness:

- Gateway: http://localhost:8000/_health and http://localhost:8000/ready
- Catalog: http://localhost:8001/_health and http://localhost:8001/ready
- Auth: http://localhost:8002/_health and http://localhost:8002/ready
- Orders: http://localhost:8003/_health and http://localhost:8003/ready
- Payments: http://localhost:8004/_health and http://localhost:8004/ready
- Notifications: http://localhost:8006/_health and http://localhost:8006/ready
- Backoffice: http://localhost:8007/_health and http://localhost:8007/ready

Frontend:

```bash
cd frontend
npm ci
VITE_API_BASE_URL=http://localhost:8000 npm run dev
```

## Certification

CI runs isolated service tests plus a full Docker Compose certification through the Gateway. It validates service readiness, business flows, distributed request-id propagation and database ownership boundaries.

```bash
JWT_SECRET=local-secret \
INTERNAL_SERVICE_TOKEN=local-internal-secret \
bash scripts/certify_microservices.sh
```

## Migration status

| Domain | Status |
| --- | --- |
| API Gateway | Active |
| Catalog | Extracted + data owner |
| Auth / Users | Extracted + identity/data owner |
| Orders | Extracted + data owner |
| Payments | Extracted, stateless persistence |
| Notifications | Extracted |
| Backoffice | Extracted + data owner |
| Legacy runtime | Removed |
| Database ownership split | Complete |
| Distributed request tracing | Complete |
| Liveness / readiness | Complete |
| GitHub main protection | Pending repository rule |

See `docs/architecture/microservices-migration.md`.
