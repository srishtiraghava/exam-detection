import traceback
from datetime import datetime, timezone
from time import monotonic
from typing import Any, Dict, List, Optional

import cv2
import numpy as np

from detection.face_detection import FaceDetector
from detection.eye_tracking import EyeTracker
from detection.mouth_detection import MouthMonitor
from detection.multi_face import MultiFaceDetector
from detection.object_detection import ObjectDetector


class ProctoringEvent:
    def __init__(
        self,
        session_id: str,
        timestamp: str,
        event_type: str,
        severity: str,
        confidence: float,
        message: str,
        metadata: Optional[Dict[str, Any]] = None,
    ):
        self.session_id = session_id
        self.timestamp = timestamp
        self.event_type = event_type
        self.severity = severity
        self.confidence = float(confidence)
        self.message = message
        self.metadata = metadata or {}

    def to_dict(self) -> Dict[str, Any]:
        return {
            "session_id": self.session_id,
            "timestamp": self.timestamp,
            "event_type": self.event_type,
            "severity": self.severity,
            "confidence": self.confidence,
            "message": self.message,
            "metadata": self.metadata,
        }


class DetectionAdapter:
    def __init__(self, config: Any, session_id: str, enable_objects: bool = False):
        self.config = config
        self.session_id = session_id
        self.face_detector = FaceDetector(config)
        self.eye_tracker = EyeTracker(config)
        self.mouth_monitor = MouthMonitor(config)
        self.multi_face_detector = MultiFaceDetector(config)
        self.object_detector = None
        if enable_objects:
            try:
                self.object_detector = ObjectDetector(config)
            except Exception:
                self.object_detector = None

        self._closed = False
        self._hold_seconds = 2.0
        self._no_face_since: float | None = None
        self._multi_since: float | None = None
        self._no_face_emitted = False
        self._multi_emitted = False
        self.last_face_count = 0
        self.last_face_present = False
        self.last_gaze = "center"
        self.last_eye_ratio = 0.3
        self.last_mouth_moving = False
        self.last_objects = False

    def process_frame(self, frame: np.ndarray) -> List[ProctoringEvent]:
        events: List[ProctoringEvent] = []

        try:
            if self._closed or frame is None or not isinstance(frame, np.ndarray) or frame.size == 0:
                return events

            timestamp = datetime.now(timezone.utc).isoformat()
            now = monotonic()

            face_count = self.multi_face_detector.get_face_count(frame)
            face_present = face_count >= 1
            self.last_face_count = face_count
            self.last_face_present = face_present

            gaze_direction, eye_ratio = self.eye_tracker.track_eyes(frame)
            self.last_gaze = gaze_direction
            self.last_eye_ratio = float(eye_ratio)
            self.last_mouth_moving = bool(self.mouth_monitor.monitor_mouth(frame))
            self.last_objects = bool(self.object_detector.detect_objects(frame)) if self.object_detector else False

            if face_count == 0:
                if self._no_face_since is None:
                    self._no_face_since = now
                if not self._no_face_emitted and now - self._no_face_since >= self._hold_seconds:
                    events.append(
                        ProctoringEvent(
                            session_id=self.session_id,
                            timestamp=timestamp,
                            event_type="NO_FACE",
                            severity="medium",
                            confidence=1.0,
                            message="Face not detected",
                            metadata={"face_count": 0},
                        )
                    )
                    self._no_face_emitted = True
            else:
                self._no_face_since = None
                self._no_face_emitted = False

            if face_count > 1:
                if self._multi_since is None:
                    self._multi_since = now
                if not self._multi_emitted and now - self._multi_since >= self._hold_seconds:
                    events.append(
                        ProctoringEvent(
                            session_id=self.session_id,
                            timestamp=timestamp,
                            event_type="MULTIPLE_FACES",
                            severity="high",
                            confidence=1.0,
                            message=f"{face_count} faces detected",
                            metadata={"face_count": face_count},
                        )
                    )
                    self._multi_emitted = True
            else:
                self._multi_since = None
                self._multi_emitted = False

            if self.last_objects:
                events.append(
                    ProctoringEvent(
                        session_id=self.session_id,
                        timestamp=timestamp,
                        event_type="OBJECT_DETECTED",
                        severity="high",
                        confidence=1.0,
                        message="Potentially suspicious object detected",
                    )
                )

        except Exception as exc:
            traceback.print_exc()
            events.append(
                ProctoringEvent(
                    session_id=self.session_id,
                    timestamp=datetime.now(timezone.utc).isoformat(),
                    event_type="DETECTION_ERROR",
                    severity="high",
                    confidence=0.0,
                    message="An error occurred while processing the frame",
                    metadata={"error": str(exc)},
                )
            )

        return events

    def decode_frame(self, frame_data: bytes) -> Optional[np.ndarray]:
        try:
            if not frame_data:
                return None
            np_data = np.frombuffer(frame_data, dtype=np.uint8)
            if np_data.size == 0:
                return None
            return cv2.imdecode(np_data, cv2.IMREAD_COLOR)
        except Exception:
            return None

    def process_binary_frame(self, frame_data: bytes) -> List[ProctoringEvent]:
        frame = self.decode_frame(frame_data)
        if frame is None:
            return []
        return self.process_frame(frame)

    def cleanup(self) -> None:
        self._closed = True

    def close(self) -> None:
        self.cleanup()
