# AI-Powered Online Exam Proctoring System

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115%2B-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-15-000000?logo=next.js&logoColor=white)](https://nextjs.org/)

A computer vision system that monitors online exams in real time. It detects suspicious behavior through webcam and microphone analysis, logs violations with evidence, and provides a proctoring dashboard with live updates and session reports.

## Features

- **Candidate assessment flow** — instructions, system check, timed MCQ + coding exam, results report
- **Browser proctoring** — webcam, microphone, screen recording, tab-switch and fullscreen monitoring
- **Face presence detection** — alerts when the candidate's face leaves the frame
- **Multi-face detection** — flags when more than one person appears, with debounce and screenshot evidence
- **Eye movement and gaze tracking** — detects excessive looking away from the screen
- **Mouth movement detection** — flags potential talking or whispering
- **Object detection** — identifies prohibited items (phone, book, etc.) via YOLO in local detection mode
- **Audio monitoring** — detects voice activity in local detection mode
- **Evidence capture** — screenshots linked to each incident, shown in the results timeline
- **Reviewer dashboard** — scores, proctoring risk, and session reports
- **Report generation** — produces HTML/PDF reports with violation summaries
- **Keystroke dynamics** — optional Merkle-tree verification in the legacy Flask exam UI

## Architecture

```
┌─────────────────────┐     REST / WebSocket     ┌──────────────────────┐
│  Next.js Dashboard  │ ◄────────────────────► │   FastAPI Backend    │
│  (localhost:3000)   │                          │   (localhost:8000)   │
└─────────────────────┘                          └──────────┬───────────┘
                                                              │
                                                   ┌──────────▼───────────┐
                                                   │  Detection Worker    │
                                                   │  (OpenCV thread)     │
                                                   ├──────────────────────┤
                                                   │ Face · Gaze · Mouth  │
                                                   │ Multi-face · Objects │
                                                   │ Audio · Screen rec.  │
                                                   └──────────────────────┘
```

Session metadata, incidents, and reports are stored in `data/exam_proctoring.sqlite3`.

## Quick Start

### Prerequisites

- Python 3.10 or newer
- Node.js 20 or newer
- A webcam and microphone
- macOS, Linux, or Windows

> **Note:** On macOS you may need `brew install portaudio` before installing `pyaudio`. On Linux, install `portaudio19-dev` and `python3-dev`.

### 1. Clone and set up Python

```bash
git clone https://github.com/anmol110923/exam-cheating-detection.git
cd exam-cheating-detection

python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Pre-download face detection weights (first run only):

```bash
python -c "from facenet_pytorch import MTCNN; MTCNN(keep_all=True)"
```

### 2. Start the backend

From the project root:

```bash
source .venv/bin/activate
uvicorn backend.app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

### 3. Start the frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000

### 4. Candidate assessment (hackathon demo)

1. Open the Assessment Center landing page.
2. Click **Start Assessment** (creates a session for Alex Morgan).
3. Run the system check: camera, microphone, screen sharing, fullscreen.
4. Click **Start Assessment** to begin the 20-minute MCQ + coding exam.
5. Webcam frames are sent to the Python detector. Multiple faces, tab switches, and fullscreen exits are recorded with screenshots.
6. Submit to see score, risk, timeline, and evidence.
7. Open **Reviewer Dashboard** (`/sessions`) for the session table.

Local detection (`Start local detection` on a session page) still uses the server webcam and the original OpenCV worker.

## Configuration

Edit `config/config.yaml` to tune detection thresholds, recording paths, and alert behavior:

```yaml
video:
  source: 0              # 0 = default webcam
  resolution: [1280, 720]
  fps: 30

detection:
  eyes:
    gaze_threshold: 2    # seconds before gaze-away alert
  mouth:
    movement_threshold: 3
  audio_monitoring:
    enabled: true
    whisper_enabled: false

logging:
  alert_cooldown: 10     # seconds between repeated alerts
```

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/sessions` | Create a session |
| `GET` | `/api/sessions` | List all sessions |
| `GET` | `/api/sessions/{id}` | Get session details |
| `POST` | `/api/sessions/{id}/start` | Start detection |
| `POST` | `/api/sessions/{id}/stop` | Stop detection |
| `GET` | `/api/sessions/{id}/status` | Current detection status |
| `GET` | `/api/sessions/{id}/incidents` | List violations |
| `POST` | `/api/reports/sessions/{id}` | Generate report |
| `GET` | `/api/media/{path}` | Serve evidence files |
| `WS` | `/ws/sessions/{id}` | Real-time event stream |

Override frontend API URLs if needed:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
NEXT_PUBLIC_WS_BASE_URL=ws://localhost:8000
```

## Project Structure

```
exam-cheating-detection/
├── backend/                 # FastAPI application
│   └── app/
│       ├── api/routes/      # REST + WebSocket endpoints
│       ├── services/        # Session manager, detection worker
│       ├── schemas/         # Pydantic models
│       └── storage/         # SQLite persistence
├── frontend/                # Next.js proctoring dashboard
│   ├── app/                 # Pages (sessions, reports, exam view)
│   ├── hooks/               # WebSocket event hook
│   └── lib/                 # API client and types
├── src/                     # Core detection modules (shared)
│   ├── detection/           # Face, gaze, mouth, object, audio
│   ├── reporting/           # Report generator
│   ├── utils/               # Recording, alerts, screen capture
│   └── main.py              # Legacy standalone entry point
├── config/                  # YAML configuration
├── data/                    # SQLite database (gitignored)
├── logs/                    # Session logs (gitignored)
└── recordings/              # Video/audio evidence (gitignored)
```

## Legacy Mode

The original standalone Python runner and Flask dashboard are still available:

```bash
# Standalone detection with OpenCV window
python src/main.py

# Flask dashboard (separate terminal)
python src/dashboard/app.py
# Dashboard: http://localhost:5000
# Mock exam verification: http://localhost:5000/exam
```

The recommended workflow is the FastAPI + Next.js stack described above.

## Troubleshooting

**Eye or face detection is inaccurate**
- Ensure good, even lighting on the face
- Position the camera at eye level
- Remove glasses if they cause glare

**`pyaudio` install fails**
- macOS: `brew install portaudio && pip install pyaudio`
- Ubuntu/Debian: `sudo apt install portaudio19-dev python3-dev`

**Backend fails to open webcam**
- Close other apps using the camera
- Check `video.source` in `config/config.yaml` (try `0`, `1`, etc.)

**Frontend cannot reach the API**
- Confirm the backend is running on port 8000
- Check CORS and `NEXT_PUBLIC_API_BASE_URL` settings

## Disclaimer

This system is intended for educational and research purposes. Always obtain explicit consent from candidates before recording video, audio, or screen activity. Comply with local privacy and data protection laws.

## Contributing

Contributions are welcome! Please open an issue or pull request for improvements.

## License

MIT License — see [LICENSE](LICENSE) for details.
