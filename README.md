# AI-Powered Online Exam Proctoring System

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115%2B-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-15-000000?logo=next.js&logoColor=white)](https://nextjs.org/)

A computer vision system that monitors online exams in real time. It detects suspicious behavior through webcam and microphone analysis, logs violations with evidence, and provides a proctoring dashboard with live updates and session reports.

## Features

<<<<<<< HEAD
- **Face Presence Detection**: Identifies when student's face is not visible
- **Eye Movement Tracking**: Detects excessive eye movements (left/right/up/down)
- **Gaze Analysis**: Monitors direction of eye gaze
- **Mouth Movement Detection**: Identifies potential talking or whispering
- **Multi-Face Detection**: Alerts when multiple faces appear in frame
- **Real-time Alerts**: Flags suspicious activities with timestamps
- **Dashboard**: Visual interface showing detection metrics and alerts
- **Object Delection**: Object Detection: Detects prohibited objects (cell phone, book, etc.).
- **Screen Recoding**: Continuously captures examinee's screen activity
- **Audio Detection**: Monitors for voice/whispering in student's environment
- **Alert Speaker**: Delivers real-time verbal warnings via text-to-speech
- **Report Generation**: Creates detailed visual PDF and HTML reports with violations summary, heatmaps, and activity timeline  
- **Keystroke Dynamics & Cryptographic Verification**: Captures timing metrics (Hold Time, Inter-Key Gap) to detect suspicious typing behavior, backed by a Merkle Tree for payload integrity (accessible via `/exam` mock interface).
=======
- **Face presence detection** — alerts when the candidate's face leaves the frame
- **Eye movement and gaze tracking** — detects excessive looking away from the screen
- **Mouth movement detection** — flags potential talking or whispering
- **Multi-face detection** — alerts when more than one person appears
- **Object detection** — identifies prohibited items (phone, book, etc.) via YOLO
- **Audio monitoring** — detects voice activity and speech violations
- **Screen recording** — captures the candidate's screen during the session
- **Real-time dashboard** — live WebSocket feed of detection status and violations
- **Evidence capture** — saves screenshots and recordings linked to each incident
- **Report generation** — produces HTML/PDF reports with violation summaries and timelines
- **Voice alerts** — optional text-to-speech warnings during the exam
>>>>>>> 7626e3dd9a9b9cf400ed7e05194266ec5a104485

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

### 4. Run a proctoring session

1. Go to **Create session** and fill in candidate and exam details.
2. On the session page, click **Start** to launch the detection worker (uses your webcam).
3. Monitor live status and violations on the dashboard.
4. Click **Stop** when finished, then open **Report** to generate and download a violation report.

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
<<<<<<< HEAD
```
4. Access the dashboard at `http://localhost:5000`
5. Access the mock exam verification interface at `http://localhost:5000/exam`

## Keystroke Dynamics & Cryptographic Verification

This feature provides client-side behavioral analysis and cryptographic integrity for typing patterns.

### What is Collected
- **Hold Time (HT)**: Duration between keydown and keyup.
- **Inter-Key Gap (IKG)**: Duration between the previous keyup and current keydown.
- **Sequence and Timestamps**: Relative timing data of the keystrokes.

### What is NOT Collected
- **Actual Typed Characters**: We do not store `event.key`, `event.code`, words, or passwords. This ensures candidate privacy.

### Cryptographic Integrity (Merkle Tree)
To prevent payload tampering before submission, the browser constructs a **SHA-256 Merkle Tree** over the deterministic sequence of typing events. The client sends the payload and the calculated Merkle Root to the server. The Flask backend independently recomputes the Merkle Root from the payload and verifies it.

If any of the following occur, the server will log a `MERKLE_TAMPERING` alert:
- An event was deleted, added, or reordered.
- A timestamp, Hold Time, or Inter-Key Gap was modified.

### Behavioral Anomaly Detection
The server independently calculates variance and counts the number of unusually fast keystrokes (IKG < 25ms). If it detects near-zero variance or a high ratio of suspicious events, it logs a `KEYSTROKE_ANOMALY` alert, which is displayed in the dashboard.

## System Architecture
```
exam_cheating_detection/
├── config/              # Configuration files
├── models/              # Pretrained models
├── src/                 # Source code
│   ├── detection/       # Detection modules
│   ├── reporting/       # Reporting application
│   ├── utils/           # Utility functions
│   ├── dashboard/       # Web dashboard
│   └── main.py          # Main application
├── logs/                # Session logs
└── recordings/          # Recorded video sessions
=======
# → http://localhost:5000
>>>>>>> 7626e3dd9a9b9cf400ed7e05194266ec5a104485
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
