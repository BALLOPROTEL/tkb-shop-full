import json
import logging
import time
import uuid

from fastapi import FastAPI, Request

logger = logging.getLogger("tkb")
if not logger.handlers:
    logging.basicConfig(level=logging.INFO, format="%(message)s")


def install_observability(app: FastAPI, service_name: str) -> None:
    @app.middleware("http")
    async def request_observability(request: Request, call_next):
        request_id = request.headers.get("x-request-id") or str(uuid.uuid4())
        request.state.request_id = request_id
        started = time.perf_counter()

        try:
            response = await call_next(request)
            status_code = response.status_code
            return response
        except Exception:
            status_code = 500
            raise
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
            if "response" in locals():
                response.headers["X-Request-ID"] = request_id
