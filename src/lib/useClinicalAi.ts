import { useEffect, useRef } from "react";
import { useSessionStore } from "@/store/sessionStore";
import type { TranscriptItem } from "@/types/session";
import { analyzeTranscript, isApiConfigured } from "./clinicalAi";

const MIN_NEW_MESSAGES = 2;
const MIN_INTERVAL_MS = 8000;

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatTranscriptForLlm(transcript: TranscriptItem[]): string {
  return transcript
    .filter((i): i is Extract<TranscriptItem, { kind: "message" }> => i.kind === "message")
    .map((i) => {
      const ts = formatTime(i.timestampSec);
      const speaker = i.speaker === "doctor" ? "MÉDICO" : "PACIENTE";
      const tag = i.autoLabeled ? " (auto)" : "";
      return `[${ts}] id=${i.id} ${speaker}${tag}: ${i.text}`;
    })
    .join("\n");
}

export function useClinicalAi() {
  const transcript = useSessionStore((s) => s.transcript);
  const setAnalysisState = useSessionStore((s) => s.setAnalysisState);
  const mergeAnalysis = useSessionStore((s) => s.mergeAnalysis);

  const lastTriggerAtRef = useRef(0);
  const lastProcessedCountRef = useRef<number | null>(null);
  const inFlightRef = useRef(false);

  const analysisEnabled = useSessionStore((s) => s.analysisEnabled);

  useEffect(() => {
    if (!isApiConfigured()) return;
    if (!analysisEnabled) return;

    const messageCount = transcript.filter((i) => i.kind === "message").length;

    if (lastProcessedCountRef.current === null) {
      lastProcessedCountRef.current = messageCount;
      return;
    }

    const newMessages = messageCount - lastProcessedCountRef.current;
    if (newMessages < MIN_NEW_MESSAGES) return;
    if (inFlightRef.current) return;

    const now = Date.now();
    if (now - lastTriggerAtRef.current < MIN_INTERVAL_MS) return;

    lastTriggerAtRef.current = now;
    lastProcessedCountRef.current = messageCount;
    inFlightRef.current = true;

    void (async () => {
      setAnalysisState("analyzing");
      try {
        const text = formatTranscriptForLlm(transcript);
        const analysis = await analyzeTranscript(text);
        mergeAnalysis(analysis);
        setAnalysisState("idle");
      } catch (e) {
        console.error("Clinical AI error:", e);
        setAnalysisState("error");
      } finally {
        inFlightRef.current = false;
      }
    })();
  }, [transcript, analysisEnabled, setAnalysisState, mergeAnalysis]);

  return { enabled: isApiConfigured() && analysisEnabled };
}
