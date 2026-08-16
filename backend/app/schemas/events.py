from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


EventType = Literal[
    "session.created",
    "session.started",
    "session.stopped",
    "detection.status",
    "violation.created",
    "recording.started",
    "recording.stopped",
    "report.ready",
    "evidence.created",
    "error",
]


class RealtimeEvent(BaseModel):
    type: EventType
    session_id: str | None = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    payload: dict[str, Any] = Field(default_factory=dict)
