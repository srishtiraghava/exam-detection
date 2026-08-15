from flask import Flask, render_template, jsonify
import os
import yaml
from datetime import datetime


# ============================================================
# PATH CONFIGURATION
# ============================================================

# Absolute path to the project root:
# C:\Users\srish\exam\exam-cheating-detection
PROJECT_ROOT = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..")
)

# Template directory:
# C:\Users\srish\exam\exam-cheating-detection\src\reporting\templates
TEMPLATE_DIR = os.path.join(
    PROJECT_ROOT,
    "src",
    "reporting",
    "templates"
)

# Configuration file:
# C:\Users\srish\exam\exam-cheating-detection\config\config.yaml
CONFIG_FILE = os.path.join(
    PROJECT_ROOT,
    "config",
    "config.yaml"
)


# ============================================================
# FLASK APPLICATION
# ============================================================

app = Flask(
    __name__,
    template_folder=TEMPLATE_DIR
)


# ============================================================
# LOAD CONFIGURATION
# ============================================================

try:
    with open(CONFIG_FILE, "r", encoding="utf-8") as f:
        config = yaml.safe_load(f) or {}

except FileNotFoundError:
    print(f"WARNING: Configuration file not found: {CONFIG_FILE}")
    config = {}

except yaml.YAMLError as e:
    print(f"ERROR: Invalid YAML configuration: {e}")
    config = {}


# ============================================================
# DASHBOARD / REPORT
# ============================================================

@app.route("/")
def dashboard():

    # Default student information
    # These can later be replaced with actual exam/session data.
    student = {
        "name": "Demo Student",
        "id": "STUDENT-001",
        "exam": "Exam Proctoring Session"
    }

    # Default statistics
    stats = {
        "total": 0,
        "by_type": {}
    }

    # Get alerts from the log file
    log_path = config.get("logging", {}).get(
        "log_path",
        os.path.join(PROJECT_ROOT, "logs")
    )

    log_file = os.path.join(log_path, "alerts.log")

    violations = []

    if os.path.exists(log_file):

        try:
            with open(log_file, "r", encoding="utf-8") as f:
                lines = f.readlines()

            # Process the most recent alerts
            for line in lines[-10:]:

                line = line.strip()

                if not line:
                    continue

                violations.append({
                    "type": "Alert",
                    "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    "image_path": None,
                    "metadata": {
                        "message": line
                    }
                })

            # Update total count
            stats["total"] = len(violations)

        except Exception as e:
            print(f"WARNING: Could not read alerts log: {e}")

    # Render the existing report template
    return render_template(
        "base_report.html",
        student=student,
        stats=stats,
        violations=violations,
        generated_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        timeline_image=None,
        heatmap_image=None
    )


# ============================================================
# API: ALERTS
# ============================================================

@app.route("/api/alerts")
def get_alerts():

    log_path = config.get("logging", {}).get(
        "log_path",
        os.path.join(PROJECT_ROOT, "logs")
    )

    log_file = os.path.join(
        log_path,
        "alerts.log"
    )

    alerts = []

    if os.path.exists(log_file):

        try:
            with open(log_file, "r", encoding="utf-8") as f:
                alerts = [
                    line.strip()
                    for line in f.readlines()[-10:]
                    if line.strip()
                ]

        except Exception as e:
            return jsonify({
                "error": f"Could not read alerts log: {str(e)}"
            }), 500

    return jsonify(alerts)


# ============================================================
# API: STATISTICS
# ============================================================

@app.route("/api/stats")
def get_stats():

    return jsonify({
        "face_detected": True,
        "current_activity": "Normal",
        "cheating_probability": 15,
        "last_alert": datetime.now().strftime("%H:%M:%S")
    })


# ============================================================
# APPLICATION START
# ============================================================

if __name__ == "__main__":

    print("=" * 60)
    print("Exam Cheating Detection Dashboard")
    print("=" * 60)

    print(f"Project root : {PROJECT_ROOT}")
    print(f"Template dir : {TEMPLATE_DIR}")
    print(f"Config file  : {CONFIG_FILE}")

    print("=" * 60)

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )