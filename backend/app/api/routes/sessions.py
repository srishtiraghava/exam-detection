from fastapi import APIRouter, HTTPException

from app.schemas.sessions import CandidateSession, CandidateSessionCreate, DetectionStatus
from app.schemas.incidents import Incident
from app.services.detection_worker import DetectionWorker
from app.services.session_manager import session_manager


router = APIRouter(prefix="/sessions", tags=["sessions"])


@router.post("", response_model=CandidateSession)
async def create_session(payload: CandidateSessionCreate) -> CandidateSession:
    return await session_manager.create_session(payload)


@router.get("", response_model=list[CandidateSession])
def list_sessions() -> list[CandidateSession]:
    return session_manager.list_sessions()


@router.get("/{session_id}", response_model=CandidateSession)
def get_session(session_id: str) -> CandidateSession:
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.post("/{session_id}/start", response_model=CandidateSession)
async def start_session(session_id: str) -> CandidateSession:
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.status == "running":
        return session

    worker = DetectionWorker(session_id)
    session_manager.workers[session_id] = worker
    updated = await session_manager.mark_running(session_id)
    worker.start()
    if not updated:
        raise HTTPException(status_code=404, detail="Session not found")
    return updated


@router.post("/{session_id}/stop", response_model=CandidateSession)
async def stop_session(session_id: str) -> CandidateSession:
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    worker = session_manager.workers.get(session_id)
    if isinstance(worker, DetectionWorker):
        worker.stop()
    updated = session_manager.mark_stopping(session_id)
    if not updated:
        raise HTTPException(status_code=404, detail="Session not found")
    return updated


@router.get("/{session_id}/status", response_model=DetectionStatus)
def get_status(session_id: str) -> DetectionStatus:
    status = session_manager.get_status(session_id)
    if not status:
        raise HTTPException(status_code=404, detail="Session not found")
    return status


@router.get("/{session_id}/incidents", response_model=list[Incident])
def list_incidents(session_id: str) -> list[Incident]:
    incidents = session_manager.list_incidents(session_id)
    if incidents is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return incidents

