import os
from functools import lru_cache
from pathlib import Path
from typing import Any

import yaml
from pydantic import BaseModel


ROOT_DIR = Path(__file__).resolve().parents[3]


class Settings(BaseModel):
    app_name: str = "Exam Cheating Detection API"
    api_prefix: str = "/api"
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:3001"]
    root_dir: Path = ROOT_DIR
    config_path: Path = ROOT_DIR / "config" / "config.yaml"


@lru_cache
def get_settings() -> Settings:
    origins = os.getenv("CORS_ORIGINS")
    return Settings(
        cors_origins=[origin.strip() for origin in origins.split(",")]
        if origins
        else ["http://localhost:3000", "http://localhost:3001"]
    )


@lru_cache
def load_detection_config() -> dict[str, Any]:
    settings = get_settings()
    with settings.config_path.open() as f:
        return yaml.safe_load(f)
