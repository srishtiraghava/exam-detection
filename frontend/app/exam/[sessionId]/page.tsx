"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { SystemCheck } from "@/components/SystemCheck";
import { CodingQuestion } from "@/components/exam/CodingQuestion";
import { ExamHeader } from "@/components/exam/ExamHeader";
import { MCQQuestion } from "@/components/exam/MCQQuestion";
import { ProctoringPanel } from "@/components/exam/ProctoringPanel";
import { QuestionNavigator } from "@/components/exam/QuestionNavigator";
import { ViolationTimeline } from "@/components/exam/ViolationTimeline";
import { WebcamPanel } from "@/components/exam/WebcamPanel";
import { useEvidenceCapture } from "@/hooks/useEvidenceCapture";
import { useExamTimer } from "@/hooks/useExamTimer";
import { useFrameStream } from "@/hooks/useFrameStream";
import { useFullscreen } from "@/hooks/useFullscreen";
import { useProctoringEvents } from "@/hooks/useProctoringEvents";
import { useScreenRecording } from "@/hooks/useScreenRecording";
import { useSessionEvents } from "@/hooks/useSessionEvents";
import { useSystemCheck } from "@/hooks/useSystemCheck";
import { useTabVisibility } from "@/hooks/useTabVisibility";
import { useToast } from "@/components/ui/toast";
import { useWebcam } from "@/hooks/useWebcam";
import { api } from "@/lib/api";
import { ASSESSMENT, CODING_QUESTION, QUESTIONS } from "@/lib/examData";
import { FACE_HOLD_MS } from "@/lib/proctoring";
import type { DetectionStatus, Incident, IncidentType, McqQuestion } from "@/lib/types";

export default function CandidateExamPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();
  const { notify } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const submittedRef = useRef(false);
  const multiSince = useRef<number | null>(null);
  const noneSince = useRef<number | null>(null);

  const [phase, setPhase] = useState<"check" | "exam">("check");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number | string>>({});
  const [language, setLanguage] = useState("javascript");
  const [source, setSource] = useState(CODING_QUESTION.starterCode.javascript);
  const [codingPassed, setCodingPassed] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [status, setStatus] = useState<DetectionStatus | null>(null);
  const [sharePrompt, setSharePrompt] = useState(false);

  const webcam = useWebcam(videoRef, true);
  const screen = useScreenRecording();
  const system = useSystemCheck(videoRef);
  const eventsApi = useProctoringEvents();
  const evidence = useEvidenceCapture(videoRef);
  const { events: wsEvents } = useSessionEvents(sessionId);

  const finishRef = useRef<() => Promise<void>>(async () => undefined);

  const onExpire = useCallback(() => {
    if (!submittedRef.current) {
      setConfirmOpen(false);
      void finishRef.current();
    }
  }, []);

  const timer = useExamTimer(ASSESSMENT.durationSeconds, phase === "exam", onExpire);

  useFrameStream(sessionId, videoRef, phase === "exam");

  const recordEvent = useCallback(
    async (type: IncidentType, metadata: Record<string, unknown> = {}) => {
      const captured = await evidence.captureScreenshot(type, Number(metadata.faceCount ?? status?.face_count ?? 0));
      const event = eventsApi.addEvent(type, metadata, captured.evidence?.imageUrl);
      if (!event) {
        return;
      }
      if (captured.evidence) {
        eventsApi.attachEvidence(captured.evidence);
      }
      try {
        await api.sendProctoringEvent(sessionId, event, captured.evidence?.imageUrl);
      } catch {
        // Keep the local timeline even if persistence fails.
      }
    },
    [evidence, eventsApi, sessionId, status?.face_count],
  );

  const onFullscreenExit = useCallback(() => {
    if (phase === "exam") {
      void recordEvent("FULLSCREEN_EXIT");
      setWarning("Fullscreen exited. Return to fullscreen to continue under standard conditions.");
    }
  }, [phase, recordEvent]);

  const fullscreen = useFullscreen(phase === "exam", onFullscreenExit);

  useTabVisibility(
    phase === "exam",
    () => {
      void recordEvent("TAB_SWITCH");
    },
    () => notify("Tab switching detected.", "warning"),
  );

  useEffect(() => {
    for (const event of wsEvents.slice(0, 3)) {
      if (event.type === "detection.status") {
        setStatus(event.payload as unknown as DetectionStatus);
      }
      if (event.type === "violation.created") {
        eventsApi.ingestIncident(event.payload as unknown as Incident);
      }
    }
  }, [eventsApi, wsEvents]);

  useEffect(() => {
    if (phase !== "exam" || !status) {
      return;
    }
    const now = Date.now();
    if (status.face_count > 1) {
      if (multiSince.current === null) {
        multiSince.current = now;
      }
      if (now - multiSince.current >= FACE_HOLD_MS) {
        void recordEvent("MULTIPLE_FACES", { faceCount: status.face_count });
        setWarning("Multiple people detected. Please ensure you are alone.");
      }
    } else {
      multiSince.current = null;
      eventsApi.clearActive("MULTIPLE_FACES");
    }

    if (status.face_count === 0) {
      if (noneSince.current === null) {
        noneSince.current = now;
      }
      if (now - noneSince.current >= FACE_HOLD_MS) {
        void recordEvent("NO_FACE", { faceCount: 0 });
        setWarning("Face not visible. Please stay in frame.");
      }
    } else {
      noneSince.current = null;
      eventsApi.clearActive("NO_FACE");
      eventsApi.clearActive("FACE_DISAPPEARED");
    }
  }, [eventsApi, phase, recordEvent, status]);

  useEffect(() => {
    if (phase === "exam" && !webcam.cameraLive) {
      void recordEvent("CAMERA_STOPPED");
      setWarning("Camera stopped. Re-enable your camera to continue monitoring.");
    } else {
      eventsApi.clearActive("CAMERA_STOPPED");
    }
  }, [eventsApi, phase, recordEvent, webcam.cameraLive]);

  useEffect(() => {
    if (phase === "exam" && !webcam.micLive) {
      void recordEvent("MICROPHONE_STOPPED");
    } else {
      eventsApi.clearActive("MICROPHONE_STOPPED");
    }
  }, [eventsApi, phase, recordEvent, webcam.micLive]);

  useEffect(() => {
    if (phase !== "exam") {
      return;
    }
    const onLeave = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [phase]);

  async function runChecks() {
    await webcam.start().catch(() => undefined);
    await system.run();
  }

  async function enableScreen() {
    try {
      await screen.requestShare(() => {
        setSharePrompt(true);
        void recordEvent("SCREEN_SHARE_STOPPED");
        setWarning("Screen sharing has stopped. Please resume screen sharing to continue.");
      });
      system.markScreen(true);
    } catch {
      system.markScreen(false);
    }
  }

  async function enableFullscreen() {
    const ok = await fullscreen.request();
    system.markFullscreen(ok);
  }

  async function beginExam() {
    if (!system.allReady) {
      notify("Complete camera and screen sharing checks before starting.", "warning");
      return;
    }
    try {
      await api.startExam(sessionId);
      await screen.start(() => {
        setSharePrompt(true);
        void recordEvent("SCREEN_SHARE_STOPPED");
        setWarning("Screen sharing has stopped. Please resume screen sharing to continue.");
      });
      await fullscreen.request();
      eventsApi.addEvent("EXAM_STARTED");
      setPhase("exam");
    } catch (err) {
      notify(err instanceof Error ? err.message : "Unable to start the assessment.", "danger");
    }
  }

  async function finish() {
    if (submittedRef.current) {
      return;
    }
    submittedRef.current = true;
    setBusy(true);
    timer.stop();
    eventsApi.addEvent("EXAM_SUBMITTED");
    try {
      await api.submitExam(sessionId, {
        answers,
        codingLanguage: language,
        codingSource: source,
        codingPassed,
        durationSeconds: timer.elapsed,
        events: eventsApi.events.map(({ screenshotUrl: _screenshotUrl, ...event }) => event),
      });
    } catch {
      // Still show local results if the network request fails.
    }
    await screen.stop();
    webcam.stop();
    sessionStorage.setItem(
      `exam-local-${sessionId}`,
      JSON.stringify({ events: eventsApi.events, evidence: eventsApi.evidence }),
    );
    router.push(`/exam/${sessionId}/results`);
  }

  finishRef.current = finish;

  useEffect(() => {
    if (videoRef.current && webcam.streamRef.current) {
      videoRef.current.srcObject = webcam.streamRef.current;
      void videoRef.current.play().catch(() => undefined);
    }
  }, [phase, webcam.ready, webcam.streamRef]);

  const question = QUESTIONS[index];
  const answeredCount = useMemo(
    () => QUESTIONS.filter((item) => answers[item.id] !== undefined && answers[item.id] !== "").length,
    [answers],
  );
  const faceLabel = status?.face_count && status.face_count > 1
    ? `${status.face_count} faces detected`
    : status?.face_present
      ? "Face detected"
      : "Looking for a face";

  if (phase === "check") {
    return (
      <div className="mx-auto max-w-5xl px-6 py-8">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Assessment Center</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">System check</h1>
        <p className="mt-2 text-sm text-slate-600">
          Complete the checks below. Your camera and screen will be monitored during the assessment.
        </p>
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <SystemCheck
            checks={system.checks}
            messages={system.messages}
            onRequestFullscreen={enableFullscreen}
            onRequestScreen={enableScreen}
            onRun={runChecks}
            running={system.running}
          />
          <div className="rounded-card border border-slate-200 bg-white p-4 shadow-card">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Camera preview</p>
            <video autoPlay className="mt-3 aspect-video w-full rounded-lg bg-slate-900 object-cover" muted playsInline ref={videoRef} />
            {webcam.error ? <p className="mt-3 text-sm text-danger">{webcam.error}</p> : null}
          </div>
        </div>
        <div className="mt-6">
          <Button disabled={!system.allReady} onClick={beginExam}>
            Start Assessment
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <ExamHeader
        assessment={ASSESSMENT.name}
        current={index + 1}
        proctoring
        recording={screen.recording}
        timer={timer.formatted}
        total={QUESTIONS.length}
      />

      {warning ? (
        <div className="border-b border-orange-200 bg-orange-50 px-6 py-3 text-sm text-warning">
          {warning}
          <div className="mt-2 flex gap-2">
            {sharePrompt ? (
              <Button
                onClick={() => {
                  void enableScreen().then(() => {
                    void screen.start();
                    setSharePrompt(false);
                    setWarning(null);
                    eventsApi.clearActive("SCREEN_SHARE_STOPPED");
                  });
                }}
                variant="secondary"
              >
                Resume Screen Sharing
              </Button>
            ) : null}
            {!fullscreen.active ? (
              <Button onClick={() => void fullscreen.request()} variant="secondary">
                Return to Fullscreen
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      {timer.warnedOne ? (
        <div className="border-b border-red-200 bg-red-50 px-6 py-2 text-sm text-danger">One minute remaining.</div>
      ) : timer.warnedFive ? (
        <div className="border-b border-orange-200 bg-orange-50 px-6 py-2 text-sm text-warning">Five minutes remaining.</div>
      ) : null}

      <div className="grid gap-6 px-6 py-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section className="rounded-card border border-slate-200 bg-white p-6 shadow-card">
          {question.type === "mcq" ? (
            <MCQQuestion
              onSelect={(value) => setAnswers((current) => ({ ...current, [question.id]: value }))}
              question={question as McqQuestion}
              selected={typeof answers[question.id] === "number" ? (answers[question.id] as number) : undefined}
            />
          ) : (
            <CodingQuestion
              language={language}
              onLanguage={(next) => {
                setLanguage(next);
                setSource(CODING_QUESTION.starterCode[next] ?? source);
              }}
              onPassed={setCodingPassed}
              onSource={setSource}
              question={CODING_QUESTION}
              source={source}
            />
          )}
        </section>

        <aside className="space-y-4">
          <WebcamPanel faceLabel={faceLabel} ready={webcam.ready} videoRef={videoRef} />
          <ProctoringPanel
            camera={webcam.cameraLive}
            face={Boolean(status?.face_present)}
            microphone={webcam.micLive}
            recording={screen.recording}
            violations={eventsApi.violationCount}
          />
          <ViolationTimeline events={eventsApi.events} />
        </aside>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 bg-white px-6 py-4">
        <QuestionNavigator answers={answers} currentIndex={index} onSelect={setIndex} />
        <div className="flex gap-2">
          <Button disabled={index === 0} onClick={() => setIndex((value) => value - 1)} variant="secondary">
            Previous
          </Button>
          {index < QUESTIONS.length - 1 ? (
            <Button onClick={() => setIndex((value) => value + 1)}>Next</Button>
          ) : (
            <Button onClick={() => setConfirmOpen(true)}>Submit</Button>
          )}
        </div>
      </footer>

      <ConfirmDialog
        busy={busy}
        confirmLabel="Submit Assessment"
        description={`You have answered ${answeredCount} of ${QUESTIONS.length} questions.`}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => void finish()}
        open={confirmOpen}
        title="Submit assessment?"
      />
    </div>
  );
}
