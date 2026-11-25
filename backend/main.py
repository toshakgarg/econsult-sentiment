import logging
import os
import time
from collections import defaultdict, deque

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from routes.analysis import router as analysis_router
from routes.history import router as history_router
from routes.upload import router as upload_router


load_dotenv()
from services.mongodb_service import ensure_indexes

logger = logging.getLogger(__name__)

app = FastAPI(
    title="Sentrix API",
    version="1.0.0",
    description=(
        "AI-powered sentiment analysis backend for MCA eConsultation comments."
    ),
)

frontend_prod_origin = os.getenv(
    "FRONTEND_PROD_ORIGIN", "https://sentrix.page"
).strip()
cors_allowed = [
    "http://localhost:5173",
    frontend_prod_origin,
]
extra_origins_raw = os.getenv("CORS_ALLOWED_ORIGINS", "").strip()
if extra_origins_raw:
    cors_allowed.extend(
        [origin.strip() for origin in extra_origins_raw.split(",") if origin.strip()]
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(dict.fromkeys(cors_allowed)),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_rate_windows: dict[str, deque] = defaultdict(deque)


@app.middleware("http")
async def process_local_rate_limit(request: Request, call_next):
    path = request.url.path
    category = None
    if path == "/api/upload/":
        category = "upload"
    elif path.startswith("/api/analysis"):
        category = "analysis"
    elif path == "/api/history/" or path.startswith("/api/history/"):
        category = "authenticated"

    if category:
        limit = int(os.getenv(f"RATE_LIMIT_{category.upper()}", "30"))
        window = int(os.getenv("RATE_LIMIT_WINDOW_SECONDS", "60"))
        client_ip = request.client.host if request.client else "unknown"
        if os.getenv("TRUST_AZURE_PROXY", "false").lower() == "true":
            forwarded = request.headers.get("x-forwarded-for", "")
            if forwarded:
                client_ip = forwarded.split(",")[0].strip()
        key = f"{category}:{client_ip}"
        now = time.monotonic()
        timestamps = _rate_windows[key]
        while timestamps and now - timestamps[0] > window:
            timestamps.popleft()
        if len(timestamps) >= limit:
            return JSONResponse(
                status_code=429,
                content={"detail": "Rate limit exceeded. Retry later."},
                headers={"Retry-After": str(window)},
            )
        timestamps.append(now)
    return await call_next(request)

app.include_router(upload_router, prefix="/api/upload", tags=["upload"])
app.include_router(analysis_router, prefix="/api/analysis", tags=["analysis"])
app.include_router(history_router, prefix="/api/history", tags=["history"])


@app.on_event("startup")
def create_database_indexes():
    if os.getenv("MONGODB_URI", "").strip():
        try:
            ensure_indexes()
        except Exception as exc:
            logger.warning(
                "MongoDB index setup could not complete during startup (%s).",
                type(exc).__name__,
            )


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "Sentrix API"}
