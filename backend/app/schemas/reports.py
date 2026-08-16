from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class Report(BaseModel):
    id: str
    session_id: str
    status: Literal["pending", "ready", "failed"] = "pending"
    path: str | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
