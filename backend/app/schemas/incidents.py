from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


IncidentType = Literal[
    "FACE_DISAPPEARED",
    "NO_FACE",
    "GAZE_AWAY",
    "MOUTH_MOVING",
    "MULTIPLE_FACES",
    "OBJECT_DETECTED",
    "VOICE_DETECTED",
    "SPEECH_VIOLATION",
    "SESSION_RECORDING",
    "TAB_SWITCH",
    "FULLSCREEN_EXIT",
    "SCREEN_SHARE_STOPPED",
    "CAMERA_STOPPED",
    "MICROPHONE_STOPPED",
]

IncidentStatus = Literal["open", "reviewed", "dismissed", "confirmed"]


class Evidence(BaseModel):
    id: str
    kind: Literal["image", "video", "audio", "screen", "report"]
    path: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Incident(BaseModel):
    id: str
    session_id: str
    type: IncidentType
    severity: int
    timestamp: datetime
    status: IncidentStatus = "open"
    metadata: dict[str, Any] = Field(default_factory=dict)
    evidence: list[Evidence] = Field(default_factory=list)
