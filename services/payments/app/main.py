import base64
import json
import os
import urllib.error
import urllib.parse
import urllib.request

import httpx
import stripe
from fastapi import Depends, FastAPI, Header, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from pydantic import BaseModel

from app.observability import get_request_id, install_observability

app = FastAPI(title="TKB Shop Payments Service", version="0.2.0")
install_observability(app, "payments")

JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = "HS256"
INTERNAL_SERVICE_TOKEN = os.getenv("INTERNAL_SERVICE_TOKEN")
ORDERS_SERVICE_URL = os.getenv("ORDERS_SERVICE_URL", "http://orders:8000").rstrip("/")
CLIENT_URL = os.getenv("CLIENT_URL", "http://localhost:5173").rstrip("/")

STRIPE_CURRENCY = os.getenv("STRIPE_CURRENCY", "eur")
STRIPE_AMOUNT_MULTIPLIER = int(os.getenv("STRIPE_AMOUNT_MULTIPLIER", "100"))
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

PAYPAL_CLIENT_ID = os.getenv("PAYPAL_CLIENT_ID")
PAYPAL_CLIENT_SECRET = os.getenv("PAYPAL_CLIENT_SECRET")
PAYPAL_ENV = os.getenv("PAYPAL_ENV", "sandbox").lower()
PAYPAL_CURRENCY = os.getenv("PAYPAL_CURRENCY", "EUR")
PAYPAL_FX_RATE = float(os.getenv("PAYPAL_FX_RATE", "655"))

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


class PayPalVerifyRequest(BaseModel):
    orderId: str
    expectedTotal: float


def _require_jwt_secret() -> str:
    if not JWT_SECRET:
        raise HTTPException(500, "JWT_SECRET non configure")
    return JWT_SECRET


def _require_internal_token(x_internal_token: str | None = Header(default=None)) -> None:
    if not INTERNAL_SERVICE_TOKEN:
        raise HTTPException(500, "INTERNAL_SERVICE_TOKEN non configure")
    if x_internal_token != INTERNAL_SERVICE_TOKEN:
        raise HTTPException(401, "Service interne non autorise")


async def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    secret = _require_jwt_secret()
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Session invalide",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token.replace("Bearer ", ""), secret, algorithms=[JWT_ALGORITHM])
        email = payload.get("sub")
        if not email:
            raise unauthorized
    except JWTError:
        raise unauthorized
    return {"email": email}


def _internal_post(url: str, payload: dict) -> dict:
    if not INTERNAL_SERVICE_TOKEN:
        raise HTTPException(500, "INTERNAL_SERVICE_TOKEN non configure")
    try:
        response = httpx.post(
            url,
            json=payload,
            headers={
                "X-Internal-Token": INTERNAL_SERVICE_TOKEN,
                "X-Request-ID": get_request_id() or "",
            },
            timeout=20.0,
        )
    except httpx.HTTPError as exc:
        raise HTTPException(502, f"Service interne indisponible: {exc}")

    if response.status_code >= 400:
        try:
            detail = response.json().get("detail")
        except ValueError:
            detail = response.text
        raise HTTPException(response.status_code, detail or "Erreur service interne")
    return response.json()


def _paypal_base_url() -> str:
    return "https://api-m.paypal.com" if PAYPAL_ENV == "live" else "https://api-m.sandbox.paypal.com"


def _paypal_access_token() -> str:
    if not PAYPAL_CLIENT_ID or not PAYPAL_CLIENT_SECRET:
        raise HTTPException(500, "PayPal non configure")

    auth = base64.b64encode(
        f"{PAYPAL_CLIENT_ID}:{PAYPAL_CLIENT_SECRET}".encode()
    ).decode()
    data = urllib.parse.urlencode({"grant_type": "client_credentials"}).encode()
    request = urllib.request.Request(
        f"{_paypal_base_url()}/v1/oauth2/token",
        data=data,
        method="POST",
    )
    request.add_header("Authorization", f"Basic {auth}")
    request.add_header("Content-Type", "application/x-www-form-urlencoded")

    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            payload = json.loads(response.read().decode())
    except urllib.error.HTTPError as exc:
        raise HTTPException(502, f"PayPal token error: {exc.code}")

    token = payload.get("access_token")
    if not token:
        raise HTTPException(502, "PayPal token invalide")
    return token


def _paypal_fetch_order(order_id: str) -> dict:
    request = urllib.request.Request(
        f"{_paypal_base_url()}/v2/checkout/orders/{order_id}"
    )
    request.add_header("Authorization", f"Bearer {_paypal_access_token()}")
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            return json.loads(response.read().decode())
    except urllib.error.HTTPError as exc:
        raise HTTPException(502, f"PayPal order error: {exc.code}")


def _verify_paypal_order(order_id: str, expected_total: float) -> dict:
    order = _paypal_fetch_order(order_id)
    if order.get("status") not in ("COMPLETED", "APPROVED"):
        raise HTTPException(400, "Paiement PayPal non confirme")

    units = order.get("purchase_units") or []
    if not units:
        raise HTTPException(400, "PayPal order invalide")

    amount = units[0].get("amount", {})
    try:
        value = float(amount.get("value", 0))
    except (TypeError, ValueError):
        raise HTTPException(400, "Montant PayPal invalide")

    expected = round(expected_total / PAYPAL_FX_RATE, 2)
    if amount.get("currency_code") and amount.get("currency_code") != PAYPAL_CURRENCY:
        raise HTTPException(400, "Devise PayPal invalide")
    if abs(value - expected) > 0.01:
        raise HTTPException(400, "Montant PayPal invalide")
    return order


@app.get("/_health")
def health():
    return {"service": "payments", "status": "ok"}


@app.post("/internal/paypal/verify")
def verify_paypal(
    data: PayPalVerifyRequest,
    _internal: None = Depends(_require_internal_token),
):
    order = _verify_paypal_order(data.orderId, data.expectedTotal)
    return {
        "verified": True,
        "provider": "paypal",
        "providerStatus": order.get("status"),
    }


@app.post("/api/payments/create-stripe-session")
def create_stripe_session(data: dict, user: dict = Depends(get_current_user)):
    if not stripe.api_key:
        raise HTTPException(500, "Cle API Stripe non configuree au serveur")

    order_id = data.get("orderId") if isinstance(data, dict) else None
    if not order_id:
        raise HTTPException(400, "Order invalide")

    context = _internal_post(
        f"{ORDERS_SERVICE_URL}/internal/orders/{order_id}/checkout-context",
        {"userEmail": user["email"]},
    )
    items = context.get("items") or []
    if not items:
        raise HTTPException(400, "Commande vide")

    line_items = []
    for item in items:
        unit_amount = int(round(float(item.get("price", 0)) * STRIPE_AMOUNT_MULTIPLIER))
        line_items.append(
            {
                "price_data": {
                    "currency": STRIPE_CURRENCY,
                    "product_data": {
                        "name": item.get("name"),
                        "images": [item.get("image")] if item.get("image") else [],
                    },
                    "unit_amount": unit_amount,
                },
                "quantity": item.get("quantity", 1),
            }
        )

    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=line_items,
            mode="payment",
            success_url=f"{CLIENT_URL}/payment-success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{CLIENT_URL}/cart",
            metadata={"orderId": order_id},
        )
    except stripe.StripeError as exc:
        raise HTTPException(502, f"Stripe error: {exc}")

    return {"id": session.id}


@app.post("/api/payments/stripe-webhook")
async def stripe_webhook(request: Request):
    webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")
    if not webhook_secret:
        raise HTTPException(500, "Stripe webhook non configure")

    payload = await request.body()
    signature = request.headers.get("stripe-signature")
    if not signature:
        raise HTTPException(400, "Signature Stripe manquante")

    try:
        event = stripe.Webhook.construct_event(payload, signature, webhook_secret)
    except ValueError:
        raise HTTPException(400, "Payload Stripe invalide")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(400, "Signature Stripe invalide")

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        order_id = session.get("metadata", {}).get("orderId")
        if order_id:
            payment_id = session.get("payment_intent") or session.get("id")
            _internal_post(
                f"{ORDERS_SERVICE_URL}/internal/orders/{order_id}/payment-completed",
                {"paymentId": payment_id},
            )

    return {"received": True}
