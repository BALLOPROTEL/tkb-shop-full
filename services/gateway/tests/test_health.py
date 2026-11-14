from fastapi.testclient import TestClient

from app.main import CATALOG_SERVICE_URL, LEGACY_SERVICE_URL, _target_for, app


client = TestClient(app)


def test_gateway_health():
    response = client.get("/_health")
    assert response.status_code == 200
    assert response.json() == {"service": "gateway", "status": "ok"}


def test_products_are_routed_to_catalog():
    assert _target_for("products") == (CATALOG_SERVICE_URL, "catalog")
    assert _target_for("products/507f1f77bcf86cd799439011") == (
        CATALOG_SERVICE_URL,
        "catalog",
    )


def test_unmigrated_routes_stay_on_legacy():
    assert _target_for("auth/login") == (LEGACY_SERVICE_URL, "legacy")
    assert _target_for("orders") == (LEGACY_SERVICE_URL, "legacy")
