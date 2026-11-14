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


def run(*args: str) -> None:
    subprocess.run([*args], check=True)


def compose(*args: str) -> None:
    run(*COMPOSE, *args)


def request(method: str, url: str, payload=None, token: str | None = None):
    data = None
    headers = {}
    if payload is not None:
        data = json.dumps(payload).encode()
        headers["Content-Type"] = "application/json"
    if token:
        headers["Authorization"] = f"Bearer {token}"

    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=20) as response:
            body = response.read().decode()
            return response.status, json.loads(body) if body else None
    except urllib.error.HTTPError as exc:
        body = exc.read().decode()
        try:
            parsed = json.loads(body)
        except json.JSONDecodeError:
            parsed = body
        return exc.code, parsed
    except (urllib.error.URLError, ConnectionResetError, OSError) as exc:
        return 0, {"transport_error": str(exc)}


def expect(status: int, expected: int, label: str, body) -> None:
    if status != expected:
        raise AssertionError(f"{label}: expected {expected}, got {status}: {body}")


def wait_for(url: str) -> None:
    for _ in range(60):
        status, _ = request("GET", url)
        if status == 200:
            return
        time.sleep(2)
    raise RuntimeError(f"Timeout waiting for {url}")


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
            "http://localhost:8000/ready",
            "http://localhost:8001/ready",
            "http://localhost:8002/ready",
            "http://localhost:8003/ready",
            "http://localhost:8004/ready",
            "http://localhost:8006/ready",
            "http://localhost:8007/ready",
        ):
            wait_for(url)
        print("Readiness checks OK", flush=True)

        print("STEP register", flush=True)
        status, body = request(
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

        print("STEP promote admin", flush=True)
        subprocess.run(
            [
                *COMPOSE,
                "exec",
                "-T",
                "mongo",
                "mongosh",
                "--quiet",
                "tkb_auth",
                "--eval",
                'db.users.updateOne({email:"ci-admin@example.com"}, {$set:{role:"admin"}})',
            ],
            check=True,
            stdout=subprocess.DEVNULL,
        )

        print("STEP login", flush=True)
        status, body = request(
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
        status, body = request(
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

        print("STEP list products", flush=True)
        status, body = request("GET", "http://localhost:8000/api/products")
        expect(status, 200, "list products", body)
        assert len(body) == 1 and body[0]["name"] == "Produit CI"

        print("STEP quote", flush=True)
        status, body = request(
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
        status, body = request(
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

        print("STEP my orders", flush=True)
        status, body = request(
            "GET",
            "http://localhost:8000/api/orders/my-orders",
            token=token,
        )
        expect(status, 200, "my orders", body)
        assert len(body) == 1 and body[0]["status"] == "En attente"

        print("STEP admin stats", flush=True)
        status, body = request(
            "GET",
            "http://localhost:8000/api/admin/stats",
            token=token,
        )
        expect(status, 200, "admin stats", body)
        assert body["usersCount"] == 1
        assert body["productsCount"] == 1
        assert body["ordersCount"] == 1

        print("STEP unknown route", flush=True)
        status, body = request(
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
