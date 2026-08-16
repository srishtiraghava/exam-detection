from datetime import datetime
from uuid import uuid4

from backend.app.schemas.events import RealtimeEvent
from backend.app.schemas.incidents import Evidence, Incident
from backend.app.schemas.reports import Report
from backend.app.schemas.sessions import CandidateSession, CandidateSessionCreate, DetectionStatus
from backend.app.services.event_bus import event_bus
from backend.app.storage.database import initialize_database
from backend.app.storage.repository import repository


class SessionManager:
    def __init__(self) -> None:
        initialize_database()
        self.workers: dict[str, object] = {}

    async def create_session(self, data: CandidateSessionCreate) -> CandidateSession:
        session = CandidateSession(
            id=str(uuid4()),
            candidate_id=data.candidate_id,
            candidate_name=data.candidate_name,
            exam_id=data.exam_id,
            exam_name=data.exam_name,
            status="created",
            created_at=datetime.utcnow(),
            config_overrides=data.config_overrides,
        )
        repository.save_session(session)
        repository.save_status(DetectionStatus(session_id=session.id))
        await event_bus.publish(RealtimeEvent(type="session.created", session_id=session.id, payload=session.model_dump(mode="json")))
        return session

    def list_sessions(self) -> list[CandidateSession]:
        return repository.list_sessions()

    def get_session(self, session_id: str) -> CandidateSession | None:
        return repository.get_session(session_id)

    def get_status(self, session_id: str) -> DetectionStatus | None:
        return repository.get_status(session_id)

    def list_incidents(self, session_id: str) -> list[Incident] | None:
        return repository.list_incidents(session_id)

    async def set_status(self, session_id: str, status: DetectionStatus) -> None:
        repository.save_status(status)
        await event_bus.publish(
            RealtimeEvent(type="detection.status", session_id=session_id, payload=status.model_dump(mode="json"))
        )

    async def add_incident(self, incident: Incident) -> None:
        repository.save_incident(incident)
        await event_bus.publish(
            RealtimeEvent(type="violation.created", session_id=incident.session_id, payload=incident.model_dump(mode="json"))
        )

    async def add_session_evidence(self, session_id: str, evidence: Evidence, metadata: dict | None = None) -> Incident:
        incident = Incident(
            id=str(uuid4()),
            session_id=session_id,
            type="SESSION_RECORDING",
            severity=0,
            timestamp=datetime.utcnow(),
            metadata=metadata or {},
            evidence=[evidence],
        )
        repository.save_incident(incident)
        await event_bus.publish(
            RealtimeEvent(type="evidence.created", session_id=session_id, payload=incident.model_dump(mode="json"))
        )
        return incident

    async def mark_running(self, session_id: str) -> CandidateSession | None:
        session = repository.get_session(session_id)
        if not session:
            return None
        updated = session.model_copy(update={"status": "running", "started_at": datetime.utcnow()})
        repository.save_session(updated)
        await event_bus.publish(RealtimeEvent(type="session.started", session_id=session_id, payload=updated.model_dump(mode="json")))
        return updated

    async def mark_completed(self, session_id: str) -> CandidateSession | None:
        session = repository.get_session(session_id)
        if not session:
            return None
        updated = session.model_copy(update={"status": "completed", "ended_at": datetime.utcnow()})
        repository.save_session(updated)
        await event_bus.publish(RealtimeEvent(type="session.stopped", session_id=session_id, payload=updated.model_dump(mode="json")))
        return updated

    async def mark_failed(self, session_id: str, error: str) -> CandidateSession | None:
        session = repository.get_session(session_id)
        if not session:
            return None
        updated = session.model_copy(update={"status": "failed", "ended_at": datetime.utcnow()})
        repository.save_session(updated)
        await event_bus.publish(
            RealtimeEvent(
                type="error",
                session_id=session_id,
                payload={"message": error, "session": updated.model_dump(mode="json")},
            )
        )
        return updated

    def mark_stopping(self, session_id: str) -> CandidateSession | None:
        session = repository.get_session(session_id)
        if not session:
            return None
        updated = session.model_copy(update={"status": "stopping"})
        repository.save_session(updated)
        return updated

    def create_report(self, session_id: str, path: str | None = None, status: str = "pending") -> Report:
        report = Report(id=str(uuid4()), session_id=session_id, path=path, status=status)
        repository.save_report(report)
        return report

    def save_report(self, report: Report) -> None:
        repository.save_report(report)

    def get_report(self, report_id: str) -> Report | None:
        return repository.get_report(report_id)

    def list_reports(self, session_id: str) -> list[Report] | None:
        return repository.list_reports(session_id)


session_manager = SessionManager()
