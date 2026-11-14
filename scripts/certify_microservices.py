import json
import os
import subprocess
import sys
import time
import urllib.error
import urllib.request

COMPOSE = ["docker", "compose", "-f", "docker-compose.microservices.yml"]

os.environ.setdefault("JWT_SECRET", "ci-jwt-secret-change-me")
os.environ.setdefault("INTERNAL_SERVICE_TOKEN", "ci-internal-secret-change-me")
os.environ.setdefault("CORS_ORIGINS", "http://localhost:5173")
os.environ.setdefault("CLIENT_URL", "http://localhost:5173")
os.environ.setdefault("AUTH_MONGO_DB_NAME", "tkb_auth")
os.environ.setdefault("CATALOG_MONGO_DB_NAME", "tkb_catalog")
os.environ.setdefault("ORDERS_MONGO_DB_NAME", "tkb_orders")
os.environ.setdefault("BACKOFFICE_MONGO_DB_NAME", "tkb_backoffice")

AUTH_DB = os.environ["AUTH_MONGO_DB_NAME"]
CATALOG_DB = os.environ["CATALOG_MONGO_DB_NAME"]
ORDERS_DB = os.environ["ORDERS_MONGO_DB_NAME"]
BACKOFFICE_DB = os.environ["BACKOFFICE_MONGO_DB_NAME"]


def run(*args: str, capture_output: bool = False) -> subprocess.CompletedProcess:
    return subprocess.run(
        [*args],
        check=True,
        text=True,
        capture_output=capture_output,
    )


def compose(*args: str, capture_output: bool = False) -> subprocess.CompletedProcess:
    return run(*COMPOSE, *args, capture_output=capture_output)


def request(
    method: str,
    url: str,
    payload=None,
    token: str | None = None,
    request_id: str | None = None,
):
    data = None
    headers = {}
    if payload is not None:
        data = json.dumps(payload).encode()
        headers["Content-Type"] = "application/json"
    if token:
        headers["Authorization"] = f"Bearer {token}"
    if request_id:
        headers["X-Request-ID"] = request_id

    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=20) as response:
            body = response.read().decode()
            response_headers = {
                key.lower(): value for key, value in response.headers.items()
            }
            return (
                response.status,
                json.loads(body) if body else None,
                response_headers,
            )
    except urllib.error.HTTPError as exc:
        body = exc.read().decode()
        try:
            parsed = json.loads(body)
        except json.JSONDecodeError:
            parsed = body
        response_headers = {
            key.lower(): value for key, value in exc.headers.items()
        }
        return exc.code, parsed, response_headers
    except (urllib.error.URLError, ConnectionResetError, OSError) as exc:
        return 0, {"transport_error": str(exc)}, {}


def expect(status: int, expected: int, label: str, body) -> None:
    if status != expected:
        raise AssertionError(
            f"{label}: expected {expected}, got {status}: {body}"
        )


def wait_for(url: str) -> None:
    for _ in range(60):
        status, _, _ = request("GET", url)
        if status == 200:
            return
        time.sleep(2)
    raise RuntimeError(f"Timeout waiting for {url}")


def mongo_eval(database: str, javascript: str) -> str:
    result = compose(
        "exec",
        "-T",
        "mongo",
        "mongosh",
        "--quiet",
        database,
        "--eval",
        javascript,
        capture_output=True,
    )
    return result.stdout.strip()


def assert_service_log_contains(service: str, request_id: str) -> None:
    needle = f'"request_id": "{request_id}"'
    for _ in range(10):
        result = compose("logs", "--no-color", service, capture_output=True)
        logs = (result.stdout or "") + (result.stderr or "")
        if needle in logs:
            return
        time.sleep(1)
    raise AssertionError(
        f"request id {request_id!r} not found in {service} logs"
    )


def assert_database_ownership() -> None:
    checks = {
        AUTH_DB: {
            "required": {"users"},
            "forbidden": {
                "products",
                "orders",
                "settings",
                "newsletter",
                "stock_commits",
            },
        },
        CATALOG_DB: {
            "required": {"products"},
            "forbidden": {
                "users",
                "orders",
                "settings",
                "newsletter",
                "password_resets",
                "admin_invites",
            },
        },
        ORDERS_DB: {
            "required": {"orders"},
            "forbidden": {
                "users",
                "products",
                "settings",
                "newsletter",
                "stock_commits",
                "password_resets",
                "admin_invites",
            },
        },
        BACKOFFICE_DB: {
            "required": {"settings", "newsletter"},
            "forbidden": {
                "users",
                "products",
                "orders",
                "stock_commits",
                "password_resets",
                "admin_invites",
            },
        },
    }

    for database, rules in checks.items():
        collections = set(
            json.loads(
                mongo_eval(
                    database,
                    "JSON.stringify(db.getCollectionNames().sort())",
                )
            )
        )
        missing = sorted(rules["required"] - collections)
        foreign = sorted(rules["forbidden"] & collections)
        if missing:
            raise AssertionError(
                f"{database} missing owned collections: {missing}"
            )
        if foreign:
            raise AssertionError(
                f"{database} contains foreign collections: {foreign}"
            )

    legacy_collections = json.loads(
        mongo_eval(
            "protel_shop",
            "JSON.stringify(db.getCollectionNames().sort())",
        )
    )
    if legacy_collections:
        raise AssertionError(
            "microservices runtime wrote to legacy protel_shop: "
            f"{legacy_collections}"
        )


def main() -> None:
    try:
        print("STEP compose config", flush=True)
        compose("config")

        print("STEP build images", flush=True)
        compose("build")

        print("STEP start stack", flush=True)
        compose(
            "up",
            "-d",
            "mongo",
            "catalog",
            "auth",
            "orders",
            "payments",
            "notifications",
            "backoffice",
            "gateway",
        )

        for url in (
            "http://localhost:8000/_health",
            "http://localhost:8001/_health",
            "http://localhost:8002/_health",
            "http://localhost:8003/_health",
            "http://localhost:8004/_health",
            "http://localhost:8006/_health",
            "http://localhost:8007/_health",
        ):
            wait_for(url)
        print("Health checks OK", flush=True)

        for url in (
            "http://localhost:8001/ready",
            "http://localhost:8002/ready",
            "http://localhost:8003/ready",
            "http://localhost:8004/ready",
            "http://localhost:8006/ready",
            "http://localhost:8007/ready",
            "http://localhost:8000/ready",
        ):
            wait_for(url)
        print("Readiness checks OK", flush=True)

        print("STEP register", flush=True)
        status, body, _ = request(
            "POST",
            "http://localhost:8000/api/auth/register",
            {
                "name": "CI Admin",
                "email": "ci-admin@example.com",
                "password": "StrongPass123!",
                "acceptTerms": True,
                "acceptSalesPolicy": True,
            },
        )
        expect(status, 200, "register", body)

        print("STEP promote admin in Auth database", flush=True)
        mongo_eval(
            AUTH_DB,
            'db.users.updateOne('
            '{email:"ci-admin@example.com"}, '
            '{$set:{role:"admin"}}'
            ')',
        )

        print("STEP login", flush=True)
        status, body, _ = request(
            "POST",
            "http://localhost:8000/api/auth/login",
            {
                "email": "ci-admin@example.com",
                "password": "StrongPass123!",
            },
        )
        expect(status, 200, "login", body)
        token = body["access_token"]

        print("STEP create product", flush=True)
        status, body, _ = request(
            "POST",
            "http://localhost:8000/api/products",
            {
                "name": "Produit CI",
                "category": "Test",
                "price": 15000,
                "stock": 5,
                "image": "",
                "images": [],
                "status": "Active",
                "colors": [],
                "sizes": ["Unique"],
            },
            token,
        )
        expect(status, 200, "create product", body)
        product_id = body["id"]

        print("STEP quote", flush=True)
        status, body, _ = request(
            "POST",
            "http://localhost:8000/api/orders/quote",
            {
                "items": [
                    {
                        "product": product_id,
                        "quantity": 2,
                        "size": "Unique",
                    }
                ]
            },
            token,
        )
        expect(status, 200, "quote", body)
        assert body["totalAmount"] == 30000

        print("STEP create order", flush=True)
        status, body, _ = request(
            "POST",
            "http://localhost:8000/api/orders",
            {
                "items": [
                    {
                        "product": product_id,
                        "quantity": 1,
                        "size": "Unique",
                    }
                ],
                "totalAmount": 0,
                "paymentMethod": "Cash",
                "shippingAddress": "CI",
                "phone": "0000000000",
            },
            token,
        )
        expect(status, 200, "create order", body)

        print("STEP create Backoffice-owned data", flush=True)
        status, body, _ = request(
            "POST",
            "http://localhost:8000/api/settings",
            {"bannerText": "CI banner"},
            token,
        )
        expect(status, 200, "settings", body)

        status, body, _ = request(
            "POST",
            "http://localhost:8000/api/newsletter",
            {"email": "ci-newsletter@example.com"},
        )
        expect(status, 200, "newsletter", body)

        print("STEP distributed request-id propagation", flush=True)
        trace_id = "cert-trace-admin-stats"
        status, body, headers = request(
            "GET",
            "http://localhost:8000/api/admin/stats",
            token=token,
            request_id=trace_id,
        )
        expect(status, 200, "admin stats", body)
        assert body["usersCount"] == 1
        assert body["productsCount"] == 1
        assert body["ordersCount"] == 1
        assert headers.get("x-request-id") == trace_id

        for service in ("gateway", "backoffice", "auth", "catalog", "orders"):
            assert_service_log_contains(service, trace_id)

        print("STEP database ownership boundaries", flush=True)
        assert_database_ownership()

        print("STEP unknown route", flush=True)
        status, body, _ = request(
            "GET",
            "http://localhost:8000/api/this-route-does-not-exist",
        )
        expect(status, 404, "unknown route", body)

        print("Microservices certification OK", flush=True)
    finally:
        subprocess.run(
            [*COMPOSE, "down", "-v", "--remove-orphans"],
            check=False,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"CERTIFICATION FAILED: {exc}", file=sys.stderr, flush=True)
        raise
