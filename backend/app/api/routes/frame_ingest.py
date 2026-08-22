import cv2
import numpy as np
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.services.browser_frame_worker import BrowserFrameWorker
from app.services.session_manager import session_manager


router = APIRouter(tags=["websocket"])


@router.websocket("/ws/sessions/{session_id}/frames")
async def ingest_frames(websocket: WebSocket, session_id: str) -> None:
    session = session_manager.get_session(session_id)
    if not session:
        await websocket.close(code=4404)
        return

    await websocket.accept()
    worker = session_manager.workers.get(session_id)
    if not isinstance(worker, BrowserFrameWorker):
        worker = BrowserFrameWorker(session_id)
        session_manager.workers[session_id] = worker
        worker.start()

    try:
        while True:
            data = await websocket.receive_bytes()
            if not data:
                continue
            np_data = np.frombuffer(data, dtype=np.uint8)
            frame = cv2.imdecode(np_data, cv2.IMREAD_COLOR)
            if frame is not None:
                worker.submit_frame(frame)
    except WebSocketDisconnect:
        return
