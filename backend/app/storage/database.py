import json
import sqlite3
from pathlib import Path
from typing import Any, Iterable

from app.core.config import get_settings


DB_PATH = get_settings().root_dir / "data" / "exam_proctoring.sqlite3"


def get_connection() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DB_PATH, check_same_thread=False)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def initialize_database() -> None:
    with get_connection() as connection:
        connection.executescript(
            """
            CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                candidate_id TEXT NOT NULL,
                candidate_name TEXT NOT NULL,
                exam_id TEXT NOT NULL,
                exam_name TEXT,
                status TEXT NOT NULL,
                created_at TEXT NOT NULL,
                started_at TEXT,
                ended_at TEXT,
                config_overrides TEXT NOT NULL DEFAULT '{}'
            );

            CREATE TABLE IF NOT EXISTS detection_statuses (
                session_id TEXT PRIMARY KEY,
                face_present INTEGER NOT NULL,
                gaze_direction TEXT NOT NULL,
                eye_ratio REAL NOT NULL,
                mouth_moving INTEGER NOT NULL,
                multiple_faces INTEGER NOT NULL,
                objects_detected INTEGER NOT NULL,
                audio_detected INTEGER NOT NULL DEFAULT 0,
                error TEXT,
                timestamp TEXT NOT NULL,
                FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS incidents (
                id TEXT PRIMARY KEY,
                session_id TEXT NOT NULL,
                type TEXT NOT NULL,
                severity INTEGER NOT NULL,
                timestamp TEXT NOT NULL,
                status TEXT NOT NULL,
                metadata TEXT NOT NULL DEFAULT '{}',
                FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS evidence (
                id TEXT PRIMARY KEY,
                incident_id TEXT NOT NULL,
                kind TEXT NOT NULL,
                path TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY(incident_id) REFERENCES incidents(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS reports (
                id TEXT PRIMARY KEY,
                session_id TEXT NOT NULL,
                status TEXT NOT NULL,
                path TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE CASCADE
            );
            """
        )
        _ensure_column(connection, "detection_statuses", "audio_detected", "INTEGER NOT NULL DEFAULT 0")
        _ensure_column(connection, "detection_statuses", "error", "TEXT")


def _ensure_column(connection: sqlite3.Connection, table: str, column: str, definition: str) -> None:
    columns = {row["name"] for row in connection.execute(f"PRAGMA table_info({table})").fetchall()}
    if column not in columns:
        connection.execute(f"ALTER TABLE {table} ADD COLUMN {column} {definition}")


def dumps_json(value: dict[str, Any]) -> str:
    return json.dumps(value)


def loads_json(value: str | None) -> dict[str, Any]:
    return json.loads(value) if value else {}


def rows_to_list(rows: Iterable[sqlite3.Row]) -> list[sqlite3.Row]:
    return list(rows)

