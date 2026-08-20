import cv2
import numpy as np
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.proctoring.event_bus import event_bus
from app.services.proctoring_session_manager import session_manager
router = APIRouter(tags=["websocket"])
@router.websocket("/ws/sessions/{session_id}")
async def session_events(websocket: WebSocket, session_id: str) -> None:
    await websocket.accept()
    await session_manager.start_session(session_id)
    await session_manager.increment_connection(session_id)
    adapter = session_manager.get_adapter(session_id)
    queue = await event_bus.subscribe(session_id)
    
    try:
        while True:
            # We expect binary frames from the frontend (JPEG/WebP).
            data = await websocket.receive_bytes()
            if data:
                # Decode the binary data to a cv2 image
                nparr = np.frombuffer(data, np.uint8)
                frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                if frame is not None:
                    # Process the frame using the existing detection engine via adapter
                    events = adapter.process_frame(frame)
                    for event in events:
                        # Log to event bus or send directly
                        await websocket.send_json({
                            "type": "proctoring_event",
                            "event": {
                                "session_id": event.session_id,
                                "event_type": event.event_type,
                                "severity": event.severity,
                                "confidence": event.confidence,
                                "message": event.message,
                                "timestamp": event.timestamp,
                                "metadata": event.metadata
                            }
                        })
            
    except WebSocketDisconnect:
        await event_bus.unsubscribe(session_id, queue)