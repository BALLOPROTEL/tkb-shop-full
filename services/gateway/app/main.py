import os

import httpx
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.observability import get_request_id, install_observability

app = FastAPI(title="TKB Shop API Gateway", version="1.1.0")
install_observability(app, "gateway")

CATALOG_SERVICE_URL = os.getenv("CATALOG_SERVICE_URL", "http://catalog:8000").rstrip("/")
AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "http://auth:8000").rstrip("/")
ORDERS_SERVICE_URL = os.getenv("ORDERS_SERVICE_URL", "http://orders:8000").rstrip("/")
PAYMENTS_SERVICE_URL = os.getenv("PAYMENTS_SERVICE_URL", "http://payments:8000").rstrip("/")
BACKOFFICE_SERVICE_URL = os.getenv("BACKOFFICE_SERVICE_URL", "http://backoffice:8000").rstrip("/")

READINESS_DEPENDENCIES = {
    "catalog": CATALOG_SERVICE_URL,
    "auth": AUTH_SERVICE_URL,
    "orders": ORDERS_SERVICE_URL,
    "payments": PAYMENTS_SERVICE_URL,
    "backoffice": BACKOFFICE_SERVICE_URL,
}

origins = [
    value.strip()
    for value in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
    if value.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

HOP_BY_HOP_RESPONSE_HEADERS = {
    "content-length",
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailers",
    "transfer-encoding",
    "upgrade",
}


def _target_for(path: str) -> tuple[str | None, str]:
    if path == "products" or path.startswith("products/"):
        return CATALOG_SERVICE_URL, "catalog"

    auth_owned = (
        path.startswith("auth/")
        or path == "users/me"
        or path.startswith("users/me/")
        or path == "admin/invites"
        or path.startswith("admin/invites/")
        or path == "admin/users"
        or path.startswith("admin/users/")
    )
    if auth_owned:
        return AUTH_SERVICE_URL, "auth"

    orders_owned = (
        path == "orders"
        or path.startswith("orders/")
        or path == "admin/orders"
        or path.startswith("admin/orders/")
    )
    if orders_owned:
        return ORDERS_SERVICE_URL, "orders"

    if path == "payments" or path.startswith("payments/"):
        return PAYMENTS_SERVICE_URL, "payments"

    backoffice_owned = (
        path == "settings"
        or path == "newsletter"
        or path == "admin/newsletter"
        or path == "admin/stats"
    )
    if backoffice_owned:
        return BACKOFFICE_SERVICE_URL, "backoffice"

    return None, "unknown"


@app.get("/_health")
def health():
    return {"service": "gateway", "status": "ok"}


@app.get("/ready")
async def readiness():
    request_id = get_request_id() or ""
    dependencies: dict[str, bool] = {}

    async with httpx.AsyncClient(timeout=2.0, follow_redirects=False) as client:
        for name, base_url in READINESS_DEPENDENCIES.items():
            try:
                response = await client.get(
                    f"{base_url}/ready",
                    headers={"X-Request-ID": request_id},
                )
                dependencies[name] = response.status_code == 200
            except httpx.HTTPError:
                dependencies[name] = False

    ready = all(dependencies.values())
    return JSONResponse(
        status_code=200 if ready else 503,
        content={
            "service": "gateway",
            "status": "ready" if ready else "not_ready",
            "dependencies": dependencies,
        },
    )


@app.api_route(
    "/api/{path:path}",
    methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
)
async def proxy(path: str, request: Request):
    base_url, routed_service = _target_for(path)
    if base_url is None:
        return Response(
            content='{"detail":"Route API inconnue"}',
            status_code=404,
            media_type="application/json",
            headers={"x-tkb-route": routed_service},
        )

    target_url = f"{base_url}/api/{path}"
    request_headers = {
        key: value
        for key, value in request.headers.items()
        if key.lower() not in {"host", "content-length"}
    }
    request_headers["x-request-id"] = request.state.request_id

    async with httpx.AsyncClient(timeout=30.0, follow_redirects=False) as client:
        upstream = await client.request(
            request.method,
            target_url,
            params=request.query_params,
            content=await request.body(),
            headers=request_headers,
        )

    response_headers = {
        key: value
        for key, value in upstream.headers.items()
        if key.lower() not in HOP_BY_HOP_RESPONSE_HEADERS
    }
    response_headers["x-tkb-route"] = routed_service

    return Response(
        content=upstream.content,
        status_code=upstream.status_code,
        headers=response_headers,
        media_type=upstream.headers.get("content-type"),
    )
