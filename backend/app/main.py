import sys
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


# ============================================================
# PROJECT PATHS
# ============================================================

# main.py:
# exam-detection/
# └── backend/
#     └── app/
#         └── main.py
#
# parents[0] -> app
# parents[1] -> backend
# parents[2] -> exam-detection

ROOT_DIR = Path(__file__).resolve().parents[2]
SRC_DIR = ROOT_DIR / "src"

# Make the existing exam-detection detection engine importable.
if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))


# ============================================================
# BACKEND IMPORTS
# ============================================================

from app.api.routes import (
    health,
    media,
    reports,
    sessions,
    websocket,
)

from app.core.config import get_settings
from app.storage.database import initialize_database


# ============================================================
# CONFIGURATION
# ============================================================

settings = get_settings()


# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title=settings.app_name,
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# API ROUTES
# ============================================================

app.include_router(
    health.router,
    prefix=settings.api_prefix,
)

app.include_router(
    sessions.router,
    prefix=settings.api_prefix,
)

app.include_router(
    reports.router,
    prefix=settings.api_prefix,
)

app.include_router(
    media.router,
    prefix=settings.api_prefix,
)

app.include_router(
    websocket.router,
)


# ============================================================
# STARTUP
# ============================================================

@app.on_event("startup")
def startup() -> None:
    """Initialize application resources."""
    initialize_database()


# ============================================================
# ROOT ENDPOINT
# ============================================================

@app.get("/")
def root():
    return {
        "status": "online",
        "application": settings.app_name,
        "message": "AI Proctored Interview & Examination Backend",
    }