import json
import logging
import time
import uuid
from contextvars import ContextVar

from fastapi import FastAPI, Request

logger = logging.getLogger("tkb")
if not logger.handlers:
    logging.basicConfig(level=logging.INFO, format="%(message)s")

_request_id: ContextVar[str | None] = ContextVar("request_id", default=None)


def get_request_id() -> str | None:
    return _request_id.get()


def install_observability(app: FastAPI, service_name: str) -> None:
    @app.middleware("http")
    async def request_observability(request: Request, call_next):
        request_id = request.headers.get("x-request-id") or str(uuid.uuid4())
        token = _request_id.set(request_id)
        request.state.request_id = request_id
        started = time.perf_counter()
        response = None
        status_code = 500

        try:
            response = await call_next(request)
            status_code = response.status_code
            response.headers["X-Request-ID"] = request_id
            return response
        finally:
            duration_ms = round((time.perf_counter() - started) * 1000, 2)
            logger.info(
                json.dumps(
                    {
                        "service": service_name,
                        "request_id": request_id,
                        "method": request.method,
                        "path": request.url.path,
                        "status": status_code,
                        "duration_ms": duration_ms,
                    },
                    ensure_ascii=False,
                )
            )
            _request_id.reset(token)
