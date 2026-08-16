from datetime import datetime

from backend.app.schemas.incidents import Evidence, Incident
from backend.app.schemas.reports import Report
from backend.app.schemas.sessions import CandidateSession, DetectionStatus
from backend.app.storage.database import dumps_json, get_connection, loads_json


def _dt(value: str | None) -> datetime | None:
    return datetime.fromisoformat(value) if value else None


def _session_from_row(row) -> CandidateSession:
    return CandidateSession(
        id=row["id"],
        candidate_id=row["candidate_id"],
        candidate_name=row["candidate_name"],
        exam_id=row["exam_id"],
        exam_name=row["exam_name"],
        status=row["status"],
        created_at=_dt(row["created_at"]) or datetime.utcnow(),
        started_at=_dt(row["started_at"]),
        ended_at=_dt(row["ended_at"]),
        config_overrides=loads_json(row["config_overrides"]),
    )


def _status_from_row(row) -> DetectionStatus:
    return DetectionStatus(
        session_id=row["session_id"],
        face_present=bool(row["face_present"]),
        gaze_direction=row["gaze_direction"],
        eye_ratio=row["eye_ratio"],
        mouth_moving=bool(row["mouth_moving"]),
        multiple_faces=bool(row["multiple_faces"]),
        objects_detected=bool(row["objects_detected"]),
        audio_detected=bool(row["audio_detected"]),
        error=row["error"],
        timestamp=_dt(row["timestamp"]) or datetime.utcnow(),
    )


def _report_from_row(row) -> Report:
    return Report(
        id=row["id"],
        session_id=row["session_id"],
        status=row["status"],
        path=row["path"],
        created_at=_dt(row["created_at"]) or datetime.utcnow(),
    )


class Repository:
    def save_session(self, session: CandidateSession) -> None:
        with get_connection() as connection:
            connection.execute(
                """
                INSERT INTO sessions (
                    id, candidate_id, candidate_name, exam_id, exam_name, status,
                    created_at, started_at, ended_at, config_overrides
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    candidate_id=excluded.candidate_id,
                    candidate_name=excluded.candidate_name,
                    exam_id=excluded.exam_id,
                    exam_name=excluded.exam_name,
                    status=excluded.status,
                    created_at=excluded.created_at,
                    started_at=excluded.started_at,
                    ended_at=excluded.ended_at,
                    config_overrides=excluded.config_overrides
                """,
                (
                    session.id,
                    session.candidate_id,
                    session.candidate_name,
                    session.exam_id,
                    session.exam_name,
                    session.status,
                    session.created_at.isoformat(),
                    session.started_at.isoformat() if session.started_at else None,
                    session.ended_at.isoformat() if session.ended_at else None,
                    dumps_json(session.config_overrides),
                ),
            )

    def list_sessions(self) -> list[CandidateSession]:
        with get_connection() as connection:
            rows = connection.execute("SELECT * FROM sessions ORDER BY created_at DESC").fetchall()
        return [_session_from_row(row) for row in rows]

    def get_session(self, session_id: str) -> CandidateSession | None:
        with get_connection() as connection:
            row = connection.execute("SELECT * FROM sessions WHERE id = ?", (session_id,)).fetchone()
        return _session_from_row(row) if row else None

    def save_status(self, status: DetectionStatus) -> None:
        with get_connection() as connection:
            connection.execute(
                """
                INSERT INTO detection_statuses (
                    session_id, face_present, gaze_direction, eye_ratio, mouth_moving,
                    multiple_faces, objects_detected, audio_detected, error, timestamp
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(session_id) DO UPDATE SET
                    face_present=excluded.face_present,
                    gaze_direction=excluded.gaze_direction,
                    eye_ratio=excluded.eye_ratio,
                    mouth_moving=excluded.mouth_moving,
                    multiple_faces=excluded.multiple_faces,
                    objects_detected=excluded.objects_detected,
                    audio_detected=excluded.audio_detected,
                    error=excluded.error,
                    timestamp=excluded.timestamp
                """,
                (
                    status.session_id,
                    int(status.face_present),
                    status.gaze_direction,
                    status.eye_ratio,
                    int(status.mouth_moving),
                    int(status.multiple_faces),
                    int(status.objects_detected),
                    int(status.audio_detected),
                    status.error,
                    status.timestamp.isoformat(),
                ),
            )

    def get_status(self, session_id: str) -> DetectionStatus | None:
        with get_connection() as connection:
            row = connection.execute("SELECT * FROM detection_statuses WHERE session_id = ?", (session_id,)).fetchone()
        return _status_from_row(row) if row else None

    def save_incident(self, incident: Incident) -> None:
        with get_connection() as connection:
            connection.execute(
                """
                INSERT INTO incidents (id, session_id, type, severity, timestamp, status, metadata)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    type=excluded.type,
                    severity=excluded.severity,
                    timestamp=excluded.timestamp,
                    status=excluded.status,
                    metadata=excluded.metadata
                """,
                (
                    incident.id,
                    incident.session_id,
                    incident.type,
                    incident.severity,
                    incident.timestamp.isoformat(),
                    incident.status,
                    dumps_json(incident.metadata),
                ),
            )
            for evidence in incident.evidence:
                connection.execute(
                    """
                    INSERT INTO evidence (id, incident_id, kind, path, created_at)
                    VALUES (?, ?, ?, ?, ?)
                    ON CONFLICT(id) DO UPDATE SET
                        kind=excluded.kind,
                        path=excluded.path,
                        created_at=excluded.created_at
                    """,
                    (
                        evidence.id,
                        incident.id,
                        evidence.kind,
                        evidence.path,
                        evidence.created_at.isoformat(),
                    ),
                )

    def list_incidents(self, session_id: str) -> list[Incident] | None:
        if not self.get_session(session_id):
            return None
        with get_connection() as connection:
            incident_rows = connection.execute(
                "SELECT * FROM incidents WHERE session_id = ? ORDER BY timestamp DESC",
                (session_id,),
            ).fetchall()
            evidence_rows = connection.execute(
                """
                SELECT evidence.* FROM evidence
                JOIN incidents ON incidents.id = evidence.incident_id
                WHERE incidents.session_id = ?
                """,
                (session_id,),
            ).fetchall()

        evidence_by_incident: dict[str, list[Evidence]] = {}
        for row in evidence_rows:
            evidence_by_incident.setdefault(row["incident_id"], []).append(
                Evidence(
                    id=row["id"],
                    kind=row["kind"],
                    path=row["path"],
                    created_at=_dt(row["created_at"]) or datetime.utcnow(),
                )
            )

        return [
            Incident(
                id=row["id"],
                session_id=row["session_id"],
                type=row["type"],
                severity=row["severity"],
                timestamp=_dt(row["timestamp"]) or datetime.utcnow(),
                status=row["status"],
                metadata=loads_json(row["metadata"]),
                evidence=evidence_by_incident.get(row["id"], []),
            )
            for row in incident_rows
        ]

    def save_report(self, report: Report) -> None:
        with get_connection() as connection:
            connection.execute(
                """
                INSERT INTO reports (id, session_id, status, path, created_at)
                VALUES (?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    status=excluded.status,
                    path=excluded.path,
                    created_at=excluded.created_at
                """,
                (report.id, report.session_id, report.status, report.path, report.created_at.isoformat()),
            )

    def get_report(self, report_id: str) -> Report | None:
        with get_connection() as connection:
            row = connection.execute("SELECT * FROM reports WHERE id = ?", (report_id,)).fetchone()
        return _report_from_row(row) if row else None

    def list_reports(self, session_id: str) -> list[Report] | None:
        if not self.get_session(session_id):
            return None
        with get_connection() as connection:
            rows = connection.execute(
                "SELECT * FROM reports WHERE session_id = ? ORDER BY created_at DESC",
                (session_id,),
            ).fetchall()
        return [_report_from_row(row) for row in rows]


repository = Repository()
