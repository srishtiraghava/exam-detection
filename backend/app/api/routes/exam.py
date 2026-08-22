import base64
from datetime import datetime

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.core.config import get_settings, load_detection_config
from app.schemas.incidents import IncidentType
from app.schemas.sessions import CandidateSession
from app.services.browser_frame_worker import BrowserFrameWorker
from app.services.exam_scoring import compute_risk_score, numeric_to_label, risk_label, score_mcq
from app.services.incident_service import IncidentService, build_evidence
from app.services.session_manager import session_manager


router = APIRouter(prefix="/sessions", tags=["exam"])


class ProctoringEventIn(BaseModel):
    type: IncidentType
    timestamp: str | None = None
    severity: str | None = None
    metadata: dict = Field(default_factory=dict)
    screenshot_base64: str | None = None


class ExamSubmitIn(BaseModel):
    answers: dict = Field(default_factory=dict)
    coding_language: str = "javascript"
    coding_source: str = ""
    coding_passed: bool = False
    duration_seconds: int = 0
    events: list[dict] = Field(default_factory=list)


def _save_screenshot(session_id: str, event_type: str, screenshot_base64: str) -> str | None:
    if not screenshot_base64:
        return None
    payload = screenshot_base64.split(",", 1)[-1]
    try:
        data = base64.b64decode(payload)
    except Exception:
        return None
    output_dir = get_settings().root_dir / "output" / "violation_captures"
    output_dir.mkdir(parents=True, exist_ok=True)
    path = output_dir / f"{session_id}_{event_type}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S_%f')}.jpg"
    path.write_bytes(data)
    return str(path)


@router.post("/{session_id}/exam/start", response_model=CandidateSession)
async def start_exam(session_id: str) -> CandidateSession:
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.status == "running":
        return session

    worker = session_manager.workers.get(session_id)
    if not isinstance(worker, BrowserFrameWorker):
        worker = BrowserFrameWorker(session_id)
        session_manager.workers[session_id] = worker
        worker.start()

    updated = await session_manager.mark_running(session_id)
    if not updated:
        raise HTTPException(status_code=404, detail="Session not found")
    return updated


@router.post("/{session_id}/proctoring-events")
async def create_proctoring_event(session_id: str, payload: ProctoringEventIn) -> dict:
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    config = load_detection_config()
    service = IncidentService(session_id, cooldown_seconds=float(config["logging"].get("alert_cooldown", 10)))
    evidence = []
    saved = _save_screenshot(session_id, payload.type, payload.screenshot_base64 or "")
    if saved:
        evidence.append(build_evidence("image", saved))

    incident = await service.emit(
        payload.type,
        metadata={**payload.metadata, "source": "browser", "severity_label": payload.severity},
        evidence=evidence,
    )
    if incident is None:
        return {"accepted": False, "reason": "cooldown"}
    return {"accepted": True, "incident": incident.model_dump(mode="json")}


@router.post("/{session_id}/submit")
async def submit_exam(session_id: str, payload: ExamSubmitIn) -> dict:
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    worker = session_manager.workers.get(session_id)
    if hasattr(worker, "stop"):
        worker.stop()

    mcq_correct, mcq_total, topic_scores = score_mcq(payload.answers)
    coding_passed = bool(payload.coding_passed)
    total_questions = mcq_total + 1
    earned = mcq_correct + (1 if coding_passed else 0)
    percent = round((earned / total_questions) * 100, 1)

    incidents = session_manager.list_incidents(session_id) or []
    violation_types = [
        incident.type
        for incident in incidents
        if incident.type not in {"SESSION_RECORDING"}
    ]
    extra_types = [str(event.get("type")) for event in payload.events if event.get("type")]
    risk = compute_risk_score(violation_types + extra_types)

    updated = session.model_copy(
        update={
            "status": "completed",
            "ended_at": datetime.utcnow(),
            "exam_answers": {
                "answers": payload.answers,
                "coding_language": payload.coding_language,
                "coding_source": payload.coding_source,
                "events": payload.events,
            },
            "exam_score": percent,
            "risk_score": risk,
            "duration_seconds": payload.duration_seconds,
            "mcq_correct": mcq_correct,
            "mcq_total": mcq_total,
            "coding_passed": coding_passed,
        }
    )
    from app.storage.repository import repository

    repository.save_session(updated)
    completed = await session_manager.mark_completed(session_id)
    if completed:
        completed = completed.model_copy(
            update={
                "exam_answers": updated.exam_answers,
                "exam_score": percent,
                "risk_score": risk,
                "duration_seconds": payload.duration_seconds,
                "mcq_correct": mcq_correct,
                "mcq_total": mcq_total,
                "coding_passed": coding_passed,
            }
        )
        repository.save_session(completed)

    return _results_payload(completed or updated)


@router.get("/{session_id}/results")
def get_results(session_id: str) -> dict:
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return _results_payload(session)


def _results_payload(session: CandidateSession) -> dict:
    incidents = session_manager.list_incidents(session.id) or []
    violations = [incident for incident in incidents if incident.type != "SESSION_RECORDING"]
    answers = session.exam_answers.get("answers", {}) if session.exam_answers else {}
    mcq_correct, mcq_total, topic_scores = score_mcq(answers)
    if session.mcq_correct is not None:
        mcq_correct = session.mcq_correct
    if session.mcq_total is not None:
        mcq_total = session.mcq_total
    coding_passed = bool(session.coding_passed)
    earned = mcq_correct + (1 if coding_passed else 0)
    total = (mcq_total or 5) + 1
    percent = session.exam_score if session.exam_score is not None else round((earned / total) * 100, 1)
    risk = session.risk_score if session.risk_score is not None else compute_risk_score([item.type for item in violations])
    counts = {"HIGH": 0, "MEDIUM": 0, "LOW": 0}
    for incident in violations:
        label = numeric_to_label(incident.severity)
        counts[label] += 1

    return {
        "session": session.model_dump(mode="json"),
        "mcqCorrect": mcq_correct,
        "mcqTotal": mcq_total,
        "codingPassed": coding_passed,
        "score": earned,
        "percent": percent,
        "riskScore": risk,
        "riskLabel": risk_label(risk),
        "durationSeconds": session.duration_seconds or 0,
        "incidents": [incident.model_dump(mode="json") for incident in violations],
        "topicScores": topic_scores,
        "severityCounts": counts,
    }
