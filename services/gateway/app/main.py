import asyncio
import os
import time

import httpx
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.observability import get_request_id, install_observability

app = FastAPI(title="TKB Shop API Gateway", version="1.3.0")
install_observability(app, "gateway")


def _service_url(name: str, default: str) -> str:
    value = os.getenv(name, default).rstrip("/")
    if "://" not in value:
        value = f"https://{value}"
    return value


GATEWAY_SHARED_TOKEN = os.getenv("GATEWAY_SHARED_TOKEN")
UPSTREAM_WAKE_TIMEOUT_SECONDS = float(os.getenv("UPSTREAM_WAKE_TIMEOUT_SECONDS", "150"))
UPSTREAM_WAKE_INTERVAL_SECONDS = float(os.getenv("UPSTREAM_WAKE_INTERVAL_SECONDS", "2"))
TRANSIENT_UPSTREAM_STATUSES = {502, 503, 504}
SAFE_RETRY_METHODS = {"GET", "HEAD", "OPTIONS"}
MUTATING_METHODS = {"POST", "PUT", "PATCH", "DELETE"}
CATALOG_SERVICE_URL = _service_url("CATALOG_SERVICE_URL", "http://catalog:8000")
AUTH_SERVICE_URL = _service_url("AUTH_SERVICE_URL", "http://auth:8000")
ORDERS_SERVICE_URL = _service_url("ORDERS_SERVICE_URL", "http://orders:8000")
PAYMENTS_SERVICE_URL = _service_url("PAYMENTS_SERVICE_URL", "http://payments:8000")
BACKOFFICE_SERVICE_URL = _service_url("BACKOFFICE_SERVICE_URL", "http://backoffice:8000")
NOTIFICATIONS_SERVICE_URL = _service_url(
    "NOTIFICATIONS_SERVICE_URL",
    "http://notifications:8000",
)

READINESS_DEPENDENCIES = {
    "catalog": CATALOG_SERVICE_URL,
    "auth": AUTH_SERVICE_URL,
    "orders": ORDERS_SERVICE_URL,
    "payments": PAYMENTS_SERVICE_URL,
    "backoffice": BACKOFFICE_SERVICE_URL,
    "notifications": NOTIFICATIONS_SERVICE_URL,
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


async def _probe_dependency(
    client: httpx.AsyncClient,
    base_url: str,
    request_id: str,
) -> bool:
    try:
        response = await client.get(
            f"{base_url}/ready",
            headers={"X-Request-ID": request_id},
            timeout=5.0,
        )
        return response.status_code == 200
    except httpx.HTTPError:
        return False


async def _wait_for_upstream_ready(
    client: httpx.AsyncClient,
    base_url: str,
    request_id: str,
) -> bool:
    deadline = time.monotonic() + UPSTREAM_WAKE_TIMEOUT_SECONDS

    while True:
        try:
            response = await client.get(
                f"{base_url}/ready",
                headers={"X-Request-ID": request_id},
                timeout=5.0,
            )
            if response.status_code == 200:
                return True
        except httpx.HTTPError:
            pass

        if time.monotonic() >= deadline:
            return False

        await asyncio.sleep(UPSTREAM_WAKE_INTERVAL_SECONDS)


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


async def _dependency_statuses(request_id: str) -> dict[str, bool]:
    async with httpx.AsyncClient(timeout=6.0, follow_redirects=False) as client:
        names = list(READINESS_DEPENDENCIES)
        checks = await asyncio.gather(
            *[
                _probe_dependency(
                    client,
                    READINESS_DEPENDENCIES[name],
                    request_id,
                )
                for name in names
            ]
        )
    return dict(zip(names, checks))


@app.get("/ready")
async def readiness():
    dependencies = await _dependency_statuses(get_request_id() or "")
    ready = all(dependencies.values())
    return JSONResponse(
        status_code=200 if ready else 503,
        content={
            "service": "gateway",
            "status": "ready" if ready else "not_ready",
            "dependencies": dependencies,
        },
    )


@app.get("/api/system/bootstrap")
async def bootstrap_services():
    dependencies = await _dependency_statuses(get_request_id() or "")
    ready = all(dependencies.values())
    return JSONResponse(
        status_code=200 if ready else 503,
        content={
            "service": "gateway",
            "status": "ready" if ready else "warming",
            "dependencies": dependencies,
        },
        headers={"retry-after": "3"} if not ready else None,
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
    if GATEWAY_SHARED_TOKEN:
        request_headers["x-gateway-token"] = GATEWAY_SHARED_TOKEN

    request_body = await request.body()

    async with httpx.AsyncClient(timeout=30.0, follow_redirects=False) as client:
        # On free staging, every domain service can cold-start independently.
        # Wake only the service required by the current request instead of
        # requiring the entire microservice stack to be ready up front.
        ready = await _wait_for_upstream_ready(
            client,
            base_url,
            request.state.request_id,
        )
        if not ready:
            return JSONResponse(
                status_code=503,
                content={
                    "detail": (
                        f"Service {routed_service} en cours de demarrage. "
                        "La boutique reste accessible ; reessayez cette action "
                        "dans quelques instants."
                    )
                },
                headers={"x-tkb-route": routed_service, "retry-after": "5"},
            )

        try:
            upstream = await client.request(
                request.method,
                target_url,
                params=request.query_params,
                content=request_body,
                headers=request_headers,
            )
        except httpx.HTTPError:
            if request.method not in SAFE_RETRY_METHODS:
                return JSONResponse(
                    status_code=502,
                    content={"detail": f"Service {routed_service} indisponible"},
                    headers={"x-tkb-route": routed_service, "retry-after": "5"},
                )

            ready = await _wait_for_upstream_ready(
                client,
                base_url,
                request.state.request_id,
            )
            if not ready:
                return JSONResponse(
                    status_code=503,
                    content={
                        "detail": (
                            f"Service {routed_service} en cours de demarrage. "
                            "Reessayez dans quelques instants."
                        )
                    },
                    headers={"x-tkb-route": routed_service, "retry-after": "5"},
                )

            upstream = await client.request(
                request.method,
                target_url,
                params=request.query_params,
                content=request_body,
                headers=request_headers,
            )

        if (
            request.method in SAFE_RETRY_METHODS
            and upstream.status_code in TRANSIENT_UPSTREAM_STATUSES
        ):
            ready = await _wait_for_upstream_ready(
                client,
                base_url,
                request.state.request_id,
            )
            if ready:
                upstream = await client.request(
                    request.method,
                    target_url,
                    params=request.query_params,
                    content=request_body,
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
