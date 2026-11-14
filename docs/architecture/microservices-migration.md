# TKB Shop - Microservices migration

## Goal

Migrate the current FastAPI monolith without breaking the React frontend or production data.

## Strategy: strangler pattern

The frontend keeps one API base URL. The API Gateway receives every `/api/*` request and decides which service owns the route.

### Phase 1 - foundation

- API Gateway introduced.
- Catalog service extracted from the monolith.
- Legacy backend containerized.
- Shared MongoDB is intentionally kept during transition.
- CI validates frontend build, Python syntax, gateway and catalog smoke tests.

Routing:

```text
React frontend
     |
     v
API Gateway :8000
     |
     +---- /api/products* --------> Catalog Service
     |
     +---- all other /api/* ------> Legacy FastAPI
```

This is transitional architecture. A shared database is not the target state.

## Target bounded contexts

### Auth service
Owns users, login, JWT issuance, password reset and admin invitations.

### Catalog service
Owns products, categories, stock-read model and product administration.

### Orders service
Owns carts converted to orders, order lifecycle, quote validation and order history.

### Payments service
Owns Stripe and PayPal integrations, webhook verification and payment state.

### Notifications service
Owns transactional email and later asynchronous notifications.

## Data migration target

Each service must eventually own its persistence. The migration order is:

1. route ownership,
2. service API contract,
3. tests,
4. collection/database ownership,
5. remove equivalent route from legacy.

No route is removed from the legacy application before the replacement service is proven through the gateway.

## Events

After Orders and Payments are extracted, introduce an event broker only where asynchronous behavior creates value. Candidate events:

- `order.created`
- `payment.completed`
- `order.status.changed`
- `stock.changed`
- `user.registered`

Do not introduce RabbitMQ/Kafka simply to make the architecture look distributed.

## Security rules

- No hard-coded JWT fallback secret.
- Secrets come from environment/platform secret stores.
- Only the gateway is public in the final topology.
- Service-to-service authentication will be added before production cutover.
- Payment webhook endpoints must retain signature verification.

## Definition of done for each extraction

- frontend contract unchanged or versioned,
- service has a health endpoint,
- unit/API smoke tests exist,
- CI is green,
- gateway routes the domain to the service,
- legacy route can be disabled without regression,
- rollback path documented.
