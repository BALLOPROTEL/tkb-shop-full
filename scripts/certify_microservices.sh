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
  return 1
}

wait_for http://localhost:8000/_health
wait_for http://localhost:8001/_health
wait_for http://localhost:8002/_health
wait_for http://localhost:8003/_health
wait_for http://localhost:8004/_health
wait_for http://localhost:8006/_health
wait_for http://localhost:8007/_health

echo "Health checks OK"

REGISTER_STATUS=$(curl -sS -o /tmp/register.json -w "%{http_code}"   -X POST http://localhost:8000/api/auth/register   -H 'Content-Type: application/json'   -d '{
    "name":"CI Admin",
    "email":"ci-admin@example.com",
    "password":"StrongPass123!",
    "acceptTerms":true,
    "acceptSalesPolicy":true
  }')

if [ "$REGISTER_STATUS" != "200" ]; then
  cat /tmp/register.json
  exit 1
fi

$COMPOSE exec -T mongo mongosh --quiet protel_shop --eval   'db.users.updateOne({email:"ci-admin@example.com"}, {$set:{role:"admin"}})' >/dev/null

TOKEN=$(curl -fsS   -X POST http://localhost:8000/api/auth/login   -H 'Content-Type: application/json'   -d '{"email":"ci-admin@example.com","password":"StrongPass123!"}'   | python -c 'import json,sys; print(json.load(sys.stdin)["access_token"])')

test -n "$TOKEN"

PRODUCT_ID=$(curl -fsS   -X POST http://localhost:8000/api/products   -H 'Content-Type: application/json'   -H "Authorization: Bearer $TOKEN"   -d '{
    "name":"Produit CI",
    "category":"Test",
    "price":15000,
    "stock":5,
    "image":"",
    "images":[],
    "status":"Active",
    "colors":[],
    "sizes":["Unique"]
  }'   | python -c 'import json,sys; print(json.load(sys.stdin)["id"])')

test -n "$PRODUCT_ID"

curl -fsS http://localhost:8000/api/products |   python -c 'import json,sys; data=json.load(sys.stdin); assert len(data)==1; assert data[0]["name"]=="Produit CI"'

QUOTE=$(curl -fsS   -X POST http://localhost:8000/api/orders/quote   -H 'Content-Type: application/json'   -H "Authorization: Bearer $TOKEN"   -d "{"items":[{"product":"$PRODUCT_ID","quantity":2,"size":"Unique"}]}")

echo "$QUOTE" | python -c 'import json,sys; data=json.load(sys.stdin); assert data["totalAmount"]==30000'

ORDER_ID=$(curl -fsS   -X POST http://localhost:8000/api/orders   -H 'Content-Type: application/json'   -H "Authorization: Bearer $TOKEN"   -d "{"items":[{"product":"$PRODUCT_ID","quantity":1,"size":"Unique"}],"totalAmount":0,"paymentMethod":"Cash","shippingAddress":"CI","phone":"0000000000"}"   | python -c 'import json,sys; print(json.load(sys.stdin)["id"])')

test -n "$ORDER_ID"

curl -fsS   -H "Authorization: Bearer $TOKEN"   http://localhost:8000/api/orders/my-orders |   python -c 'import json,sys; data=json.load(sys.stdin); assert len(data)==1; assert data[0]["status"]=="En attente"'

curl -fsS   -H "Authorization: Bearer $TOKEN"   http://localhost:8000/api/admin/stats |   python -c 'import json,sys; data=json.load(sys.stdin); assert data["usersCount"]==1; assert data["productsCount"]==1; assert data["ordersCount"]==1'

UNKNOWN_STATUS=$(curl -sS -o /tmp/unknown.json -w "%{http_code}"   http://localhost:8000/api/this-route-does-not-exist)
if [ "$UNKNOWN_STATUS" != "404" ]; then
  echo "Expected unknown route to return 404, got $UNKNOWN_STATUS"
  cat /tmp/unknown.json
  exit 1
fi

echo "Microservices certification OK"
