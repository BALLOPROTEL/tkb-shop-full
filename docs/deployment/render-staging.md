# Render staging deployment

This deployment is the first hosted validation of the TKB Shop microservices architecture.

## Topology

- Vercel keeps hosting the React/Vite frontend.
- Render hosts seven FastAPI web services in Frankfurt.
- The Gateway is the only API endpoint the frontend should use.
- Auth, Catalog, Orders, Payments and Backoffice reject direct `/api/*` calls when `GATEWAY_SHARED_TOKEN` is configured.
- Internal `/internal/*` contracts remain protected by `INTERNAL_SERVICE_TOKEN`.
- MongoDB stays external (MongoDB Atlas is recommended for staging).

All Render services use the free compute plan for this first staging deployment.

## Why web services instead of private services for staging

Render private services do not have a free compute plan. The staging topology therefore uses free web services and application-level trust tokens to keep the functional API behind the Gateway.

This is intentionally a staging compromise. For production, promote the internal services to private services on paid always-on compute and switch service-to-service URLs to Render private networking.

## Required secret for initial deployment

Only `MONGO_URI` is mandatory to bring the core stack to readiness. It is entered once on the Auth service during Blueprint approval and referenced by Catalog, Orders and Backoffice.

The Blueprint generates:
- `GATEWAY_SHARED_TOKEN`
- `INTERNAL_SERVICE_TOKEN`
- `JWT_SECRET`

Do not commit their values.

## Optional integrations after core readiness

Payments:
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`

Notifications:
- `SMTP_HOST`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`

Configure those in Render only after the core Gateway/Auth/Catalog/Orders/Backoffice flow is healthy.

## Deployment sequence

1. Merge the deployment PR after all ten GitHub checks pass.
2. Create the Render Blueprint from `render.yaml`.
3. Review the Blueprint plan.
4. Provide `MONGO_URI` during approval.
5. Apply the Blueprint.
6. Verify every service `/_health`.
7. Verify stateful service `/ready` endpoints.
8. Verify Gateway `/ready`.
9. Point Vercel's API base URL to the Render Gateway.
10. Run the end-to-end browser recipe.
11. Configure Stripe/PayPal/SMTP and test those flows separately.

## Free-plan behavior

Free Render web services can spin down after inactivity. The first request after idle time can therefore be slow. This is acceptable for staging but not the intended production posture.
