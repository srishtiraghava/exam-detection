import yaml
import asyncio
import numpy as np
from typing import Dict, Any
from .detection_adapter import DetectionAdapter
class ProctoringSessionManager:
    def __init__(self):
        self.sessions: Dict[str, Dict[str, Any]] = {}
        with open('../config/config.yaml', 'r') as f:
            self.config = yaml.safe_load(f)
    async def start_session(self, session_id: str):
        if session_id not in self.sessions:
            self.sessions[session_id] = {
                'adapter': DetectionAdapter(self.config, session_id),
                'active_connections': 0,
                'running': True
            }
    async def increment_connection(self, session_id: str):
        if session_id in self.sessions:
            self.sessions[session_id]['active_connections'] += 1
    async def decrement_connection(self, session_id: str):
        if session_id in self.sessions:
            self.sessions[session_id]['active_connections'] -= 1
            if self.sessions[session_id]['active_connections'] <= 0:
                await self.stop_session(session_id)
    async def stop_session(self, session_id: str):
        if session_id in self.sessions:
            self.sessions[session_id]['running'] = False
            # Clean up adapter resources if any
            del self.sessions[session_id]
    def get_adapter(self, session_id: str) -> DetectionAdapter:
        if session_id in self.sessions:
            return self.sessions[session_id]['adapter']
        return None
session_manager = ProctoringSessionManager()