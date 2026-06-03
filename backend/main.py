import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.analysis import router as analysis_router
from routes.history import router as history_router
from routes.upload import router as upload_router


load_dotenv()

app = FastAPI(
    title="Sentrix API",
    version="1.0.0",
    description=(
        "AI-powered sentiment analysis backend for MCA eConsultation comments."
    ),
)

frontend_prod_origin = os.getenv(
    "FRONTEND_PROD_ORIGIN", "https://your-frontend-app.azurestaticapps.net"
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

app.include_router(upload_router, prefix="/api/upload", tags=["upload"])
app.include_router(analysis_router, prefix="/api/analysis", tags=["analysis"])
app.include_router(history_router, prefix="/api/history", tags=["history"])


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "Sentrix API"}
