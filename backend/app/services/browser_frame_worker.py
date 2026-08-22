import asyncio
import threading
from datetime import datetime
from typing import Any

import cv2
import numpy as np

from app.core.config import load_detection_config
from app.schemas.sessions import DetectionStatus
from app.services.detection_adapter import DetectionAdapter
from app.services.incident_service import IncidentService, build_evidence
from app.services.session_manager import session_manager
from utils.screenshot_utils import ViolationCapturer


class BrowserFrameWorker:
    def __init__(self, session_id: str) -> None:
        self.session_id = session_id
        self.config = load_detection_config()
        self.stop_event = threading.Event()
        self.thread: threading.Thread | None = None
        self.loop: asyncio.AbstractEventLoop | None = None
        self._lock = threading.Lock()
        self._latest_frame: np.ndarray | None = None

    def start(self) -> None:
        if self.thread and self.thread.is_alive():
            return
        self.loop = asyncio.get_running_loop()
        self.thread = threading.Thread(target=self._run, daemon=True)
        self.thread.start()

    def stop(self) -> None:
        self.stop_event.set()

    def submit_frame(self, frame: np.ndarray) -> None:
        with self._lock:
            self._latest_frame = frame

    def _submit(self, coroutine: Any) -> None:
        if self.loop:
            asyncio.run_coroutine_threadsafe(coroutine, self.loop)

    def _take_frame(self) -> np.ndarray | None:
        with self._lock:
            frame = self._latest_frame
            self._latest_frame = None
            return frame

    def _run(self) -> None:
        incident_service = IncidentService(
            self.session_id,
            cooldown_seconds=float(self.config["logging"].get("alert_cooldown", 10)),
        )
        violation_capturer = ViolationCapturer(self.config)
        adapter = DetectionAdapter(self.config, self.session_id, enable_objects=False)
        interval = 0.25

        try:
            while not self.stop_event.is_set():
                frame = self._take_frame()
                if frame is None:
                    self.stop_event.wait(interval)
                    continue

                events = adapter.process_frame(frame)
                status = DetectionStatus(
                    session_id=self.session_id,
                    face_present=adapter.last_face_present,
                    face_count=adapter.last_face_count,
                    gaze_direction=adapter.last_gaze,
                    eye_ratio=adapter.last_eye_ratio,
                    mouth_moving=adapter.last_mouth_moving,
                    multiple_faces=adapter.last_face_count > 1,
                    objects_detected=adapter.last_objects,
                    timestamp=datetime.utcnow(),
                )
                self._submit(session_manager.set_status(self.session_id, status))

                for event in events:
                    violation_type = event.event_type
                    if violation_type == "DETECTION_ERROR":
                        continue
                    if not incident_service.can_emit(violation_type):
                        continue
                    capture = violation_capturer.capture_violation(frame, violation_type)
                    self._submit(
                        incident_service.emit(
                            violation_type,  # type: ignore[arg-type]
                            status=status,
                            evidence=[build_evidence("image", capture["image_path"])],
                            metadata=event.metadata,
                            apply_cooldown=False,
                        )
                    )
        except Exception as exc:
            self._submit(session_manager.mark_failed(self.session_id, str(exc)))
        finally:
            adapter.cleanup()
