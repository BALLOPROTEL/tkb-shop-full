# TKB Shop

TKB Shop is an e-commerce application built with React/Vite and FastAPI/MongoDB.

## Current architecture

The repository is being migrated from a FastAPI monolith to microservices using a **strangler pattern**. The public frontend contract stays stable under `/api/*`.

During the migration:

- `gateway` is the single frontend entry point.
- `catalog` owns `/api/products*`.
- all routes not extracted yet are proxied to the legacy FastAPI application.
- future services: `auth`, `orders`, `payments`, `notifications`.

This lets us move domain by domain without a big-bang rewrite or breaking the frontend.

## Run the migration stack locally

1. Copy `.env.microservices.example` to `.env`.
2. Set a strong `JWT_SECRET`.
3. Run:

```bash
docker compose -f docker-compose.microservices.yml up --build
```

Gateway: http://localhost:8000  
Catalog direct health: http://localhost:8001/_health  
Legacy direct health/docs: http://localhost:8005/docs

For the frontend:

```bash
cd frontend
npm ci
VITE_API_BASE_URL=http://localhost:8000 npm run dev
```

## Migration status

| Domain | Status |
| --- | --- |
| API Gateway | Foundation |
| Catalog | Extracted first |
| Auth / Users | Planned |
| Orders | Planned |
| Payments | Planned |
| Notifications / email | Planned |
| Legacy monolith | Kept temporarily as fallback |

See `docs/architecture/microservices-migration.md` for the detailed migration path.
