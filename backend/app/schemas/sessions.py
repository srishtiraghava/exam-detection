from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


SessionStatus = Literal["created", "running", "stopping", "completed", "failed"]


class CandidateSessionCreate(BaseModel):
    candidate_id: str
    candidate_name: str
    exam_id: str
    exam_name: str | None = None
    config_overrides: dict[str, Any] = Field(default_factory=dict)


class CandidateSession(BaseModel):
    id: str
    candidate_id: str
    candidate_name: str
    exam_id: str
    exam_name: str | None = None
    status: SessionStatus
    created_at: datetime
    started_at: datetime | None = None
    ended_at: datetime | None = None
    config_overrides: dict[str, Any] = Field(default_factory=dict)


class DetectionStatus(BaseModel):
    session_id: str
    face_present: bool = False
    gaze_direction: str = "center"
    eye_ratio: float = 0.3
    mouth_moving: bool = False
    multiple_faces: bool = False
    objects_detected: bool = False
    audio_detected: bool = False
    error: str | None = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
