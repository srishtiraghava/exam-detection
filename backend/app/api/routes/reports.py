from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from backend.app.schemas.reports import Report
from backend.app.services.session_manager import session_manager
from reporting.report_generator import ReportGenerator
from backend.app.core.config import load_detection_config


router = APIRouter(prefix="/reports", tags=["reports"])


@router.post("/sessions/{session_id}", response_model=Report)
def create_report(session_id: str) -> Report:
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    incidents = session_manager.list_incidents(session_id) or []
    report = session_manager.create_report(session_id)

    student_info = {
        "id": session.candidate_id,
        "name": session.candidate_name,
        "exam": session.exam_name or session.exam_id,
        "course": session.exam_id,
    }
    report_violations = []
    for incident in incidents:
        data = incident.model_dump(mode="json")
        data["timestamp"] = incident.timestamp.strftime("%Y%m%d_%H%M%S_%f")
        if incident.evidence:
            data["image_path"] = incident.evidence[0].path
        report_violations.append(data)

    path = ReportGenerator(load_detection_config()).generate_report(student_info, report_violations, output_format="html")
    if not path:
        failed = report.model_copy(update={"status": "failed"})
        session_manager.save_report(failed)
        return failed

    ready = report.model_copy(update={"status": "ready", "path": path})
    session_manager.save_report(ready)
    return ready


@router.get("/sessions/{session_id}", response_model=list[Report])
def list_reports(session_id: str) -> list[Report]:
    reports = session_manager.list_reports(session_id)
    if reports is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return reports


@router.get("/{report_id}", response_model=Report)
def get_report(report_id: str) -> Report:
    report = session_manager.get_report(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report


@router.get("/{report_id}/download")
def download_report(report_id: str) -> FileResponse:
    report = session_manager.get_report(report_id)
    if not report or not report.path:
        raise HTTPException(status_code=404, detail="Report not found")
    path = Path(report.path)
    if not path.exists() or not path.is_file():
        raise HTTPException(status_code=404, detail="Report file not found")
    return FileResponse(path)
