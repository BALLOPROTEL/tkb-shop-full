import os

import httpx
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="TKB Shop API Gateway", version="0.2.0")

CATALOG_SERVICE_URL = os.getenv("CATALOG_SERVICE_URL", "http://catalog:8000").rstrip("/")
AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "http://auth:8000").rstrip("/")
LEGACY_SERVICE_URL = os.getenv("LEGACY_SERVICE_URL", "http://legacy-api:8000").rstrip("/")

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


def _target_for(path: str) -> tuple[str, str]:
    if path == "products" or path.startswith("products/"):
        return CATALOG_SERVICE_URL, "catalog"

    auth_owned = (
        path.startswith("auth/")
        or path == "users/me"
        or path.startswith("users/me/")
        or path == "admin/invites"
        or path.startswith("admin/invites/")
    )
    if auth_owned:
        return AUTH_SERVICE_URL, "auth"

    return LEGACY_SERVICE_URL, "legacy"


@app.get("/_health")
def health():
    return {"service": "gateway", "status": "ok"}


@app.api_route(
    "/api/{path:path}",
    methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
)
async def proxy(path: str, request: Request):
    base_url, routed_service = _target_for(path)
    target_url = f"{base_url}/api/{path}"

    request_headers = {
        key: value
        for key, value in request.headers.items()
        if key.lower() not in {"host", "content-length"}
    }

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
