MCQ_ANSWER_KEY = {
    "q1": 1,
    "q2": 2,
    "q3": 2,
    "q4": 3,
    "q5": 1,
}

MCQ_TOPICS = {
    "q1": "Data Structures",
    "q2": "DBMS",
    "q3": "Operating Systems",
    "q4": "Computer Networks",
    "q5": "Programming",
}

RISK_WEIGHTS = {
    "MULTIPLE_FACES": 40,
    "SCREEN_SHARE_STOPPED": 35,
    "CAMERA_STOPPED": 20,
    "FULLSCREEN_EXIT": 15,
    "TAB_SWITCH": 10,
    "NO_FACE": 10,
    "FACE_DISAPPEARED": 10,
    "MICROPHONE_STOPPED": 10,
    "OBJECT_DETECTED": 15,
}


def score_mcq(answers: dict) -> tuple[int, int, list[dict]]:
    correct = 0
    topic_totals: dict[str, dict[str, int]] = {}
    for question_id, expected in MCQ_ANSWER_KEY.items():
        topic = MCQ_TOPICS[question_id]
        bucket = topic_totals.setdefault(topic, {"correct": 0, "total": 0})
        bucket["total"] += 1
        selected = answers.get(question_id)
        try:
            selected_value = int(selected)
        except (TypeError, ValueError):
            selected_value = selected
        if selected_value == expected:
            correct += 1
            bucket["correct"] += 1
    topic_scores = [
        {
            "topic": topic,
            "correct": values["correct"],
            "total": values["total"],
            "percent": round((values["correct"] / values["total"]) * 100) if values["total"] else 0,
        }
        for topic, values in topic_totals.items()
    ]
    return correct, len(MCQ_ANSWER_KEY), topic_scores


def compute_risk_score(event_types: list[str]) -> int:
    total = sum(RISK_WEIGHTS.get(event_type, 0) for event_type in event_types)
    return max(0, min(100, total))


def risk_label(score: int) -> str:
    if score <= 20:
        return "LOW"
    if score <= 50:
        return "MEDIUM"
    return "HIGH"


def numeric_to_label(severity: int) -> str:
    if severity >= 4:
        return "HIGH"
    if severity >= 2:
        return "MEDIUM"
    return "LOW"
