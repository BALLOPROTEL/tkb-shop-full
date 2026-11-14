#!/usr/bin/env bash
set -euo pipefail

COMPOSE="docker compose -f docker-compose.microservices.yml"

export JWT_SECRET="${JWT_SECRET:-ci-jwt-secret-change-me}"
export INTERNAL_SERVICE_TOKEN="${INTERNAL_SERVICE_TOKEN:-ci-internal-secret-change-me}"
export CORS_ORIGINS="${CORS_ORIGINS:-http://localhost:5173}"
export CLIENT_URL="${CLIENT_URL:-http://localhost:5173}"

cleanup() {
  $COMPOSE down -v --remove-orphans >/dev/null 2>&1 || true
}
trap cleanup EXIT

fail_response() {
  local label="$1"
  local status="$2"
  local file="$3"
  echo "[cert] $label failed with HTTP $status"
  cat "$file" || true
  exit 1
}

$COMPOSE config >/dev/null
$COMPOSE build
$COMPOSE up -d mongo catalog auth orders payments notifications backoffice gateway

wait_for() {
  local url="$1"
  local attempts=60
  for _ in $(seq 1 "$attempts"); do
    if curl -fsS "$url" >/dev/null 2>&1; then
      return 0
    fi
    sleep 2
  done
  echo "Timeout waiting for $url"
  $COMPOSE ps
  exit 1
}

wait_for http://localhost:8000/_health
wait_for http://localhost:8001/_health
wait_for http://localhost:8002/_health
wait_for http://localhost:8003/_health
wait_for http://localhost:8004/_health
wait_for http://localhost:8006/_health
wait_for http://localhost:8007/_health

echo "[cert] health checks OK"

echo "[cert] register"
REGISTER_STATUS=$(curl -sS -o /tmp/register.json -w "%{http_code}" \
  -X POST http://localhost:8000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{
    "name":"CI Admin",
    "email":"ci-admin@example.com",
    "password":"StrongPass123!",
    "acceptTerms":true,
    "acceptSalesPolicy":true
  }')
[ "$REGISTER_STATUS" = "200" ] || fail_response "register" "$REGISTER_STATUS" /tmp/register.json

$COMPOSE exec -T mongo mongosh --quiet protel_shop --eval \
  'db.users.updateOne({email:"ci-admin@example.com"}, {$set:{role:"admin"}})' >/dev/null

echo "[cert] login"
LOGIN_STATUS=$(curl -sS -o /tmp/login.json -w "%{http_code}" \
  -X POST http://localhost:8000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"ci-admin@example.com","password":"StrongPass123!"}')
[ "$LOGIN_STATUS" = "200" ] || fail_response "login" "$LOGIN_STATUS" /tmp/login.json
TOKEN=$(python -c 'import json; print(json.load(open("/tmp/login.json"))["access_token"])')
test -n "$TOKEN"

echo "[cert] create product"
PRODUCT_STATUS=$(curl -sS -o /tmp/product.json -w "%{http_code}" \
  -X POST http://localhost:8000/api/products \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name":"Produit CI",
    "category":"Test",
    "price":15000,
    "stock":5,
    "image":"",
    "images":[],
    "status":"Active",
    "colors":[],
    "sizes":["Unique"]
  }')
[ "$PRODUCT_STATUS" = "200" ] || fail_response "create product" "$PRODUCT_STATUS" /tmp/product.json
PRODUCT_ID=$(python -c 'import json; print(json.load(open("/tmp/product.json"))["id"])')
test -n "$PRODUCT_ID"

echo "[cert] list products"
curl -fsS http://localhost:8000/api/products | \
  python -c 'import json,sys; data=json.load(sys.stdin); assert len(data)==1; assert data[0]["name"]=="Produit CI"'

echo "[cert] quote order"
QUOTE_PAYLOAD=$(python -c 'import json,sys; print(json.dumps({"items":[{"product":sys.argv[1],"quantity":2,"size":"Unique"}]}))' "$PRODUCT_ID")
QUOTE_STATUS=$(curl -sS -o /tmp/quote.json -w "%{http_code}" \
  -X POST http://localhost:8000/api/orders/quote \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $TOKEN" \
  -d "$QUOTE_PAYLOAD")
[ "$QUOTE_STATUS" = "200" ] || fail_response "quote order" "$QUOTE_STATUS" /tmp/quote.json
python -c 'import json; data=json.load(open("/tmp/quote.json")); assert data["totalAmount"]==30000'

echo "[cert] create order"
ORDER_PAYLOAD=$(python -c 'import json,sys; print(json.dumps({"items":[{"product":sys.argv[1],"quantity":1,"size":"Unique"}],"totalAmount":0,"paymentMethod":"Cash","shippingAddress":"CI","phone":"0000000000"}))' "$PRODUCT_ID")
ORDER_STATUS=$(curl -sS -o /tmp/order.json -w "%{http_code}" \
  -X POST http://localhost:8000/api/orders \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $TOKEN" \
  -d "$ORDER_PAYLOAD")
[ "$ORDER_STATUS" = "200" ] || fail_response "create order" "$ORDER_STATUS" /tmp/order.json
ORDER_ID=$(python -c 'import json; print(json.load(open("/tmp/order.json"))["id"])')
test -n "$ORDER_ID"

echo "[cert] list my orders"
curl -fsS \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/orders/my-orders | \
  python -c 'import json,sys; data=json.load(sys.stdin); assert len(data)==1; assert data[0]["status"]=="En attente"'

echo "[cert] admin stats via service contracts"
curl -fsS \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/admin/stats | \
  python -c 'import json,sys; data=json.load(sys.stdin); assert data["usersCount"]==1; assert data["productsCount"]==1; assert data["ordersCount"]==1'

echo "[cert] unknown route"
UNKNOWN_STATUS=$(curl -sS -o /tmp/unknown.json -w "%{http_code}" \
  http://localhost:8000/api/this-route-does-not-exist)
if [ "$UNKNOWN_STATUS" != "404" ]; then
  fail_response "unknown route" "$UNKNOWN_STATUS" /tmp/unknown.json
fi

echo "[cert] microservices certification OK"
