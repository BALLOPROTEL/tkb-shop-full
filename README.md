# TKB Shop

TKB Shop is an e-commerce application built with React/Vite and FastAPI/MongoDB.

## Current architecture

The repository is being migrated from a FastAPI monolith to microservices using a **strangler pattern**. The public frontend contract stays stable under `/api/*`.

Current route ownership:

- `gateway`: single frontend entry point.
- `catalog`: owns `/api/products*`.
- `auth`: owns `/api/auth/*`, `/api/users/me` and `/api/admin/invites*`.
- `legacy-api`: temporarily owns routes not extracted yet.
- planned next: `orders`, `payments`, `notifications`.

## Run locally

1. Copy `.env.microservices.example` to `.env`.
2. Set a strong `JWT_SECRET`.
3. Run:

```bash
docker compose -f docker-compose.microservices.yml up --build
```

Gateway: http://localhost:8000  
Catalog health: http://localhost:8001/_health  
Auth health: http://localhost:8002/_health  
Legacy docs: http://localhost:8005/docs

For the frontend:

```bash
cd frontend
npm ci
VITE_API_BASE_URL=http://localhost:8000 npm run dev
```

## Migration status

| Domain | Status |
| --- | --- |
| API Gateway | Active |
| Catalog | Extracted |
| Auth / Users | Extracted |
| Orders | Planned |
| Payments | Planned |
| Notifications / email | Planned |
| Legacy monolith | Fallback during migration |

See `docs/architecture/microservices-migration.md`.
