import { useCallback, useEffect, useRef } from "react";
import { useSessionStore } from "@/store/sessionStore";
import { nextTimestamp } from "./sessionSelectors";
import { detectRedFlags } from "./redFlagDetection";

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((e: unknown) => void) | null;
  onerror: ((e: unknown) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function useSpeechRecognition() {
  const isRecording = useSessionStore((s) => s.isRecording);
  const setRecording = useSessionStore((s) => s.setRecording);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const wantsRecordingRef = useRef(false);

  const Ctor = getCtor();
  const isSupported = Ctor !== null;

  const start = useCallback(() => {
    if (!Ctor) return;
    if (recognitionRef.current) return;

    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "pt-BR";

    recognition.onresult = (event: unknown) => {
      const e = event as {
        resultIndex: number;
        results: ArrayLike<{
          isFinal: boolean;
          0: { transcript: string };
        }>;
      };

      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i];
        if (result.isFinal) {
          const text = result[0].transcript.trim();
          if (text) {
            const state = useSessionStore.getState();
            state.addMessage({
              speaker: "doctor",
              text,
              timestampSec: nextTimestamp(state.transcript, 6),
              redFlags: detectRedFlags(text),
              autoLabeled: true,
            });
          }
        } else {
          interim += result[0].transcript;
        }
      }
      useSessionStore.getState().setInterim(interim);
    };

    recognition.onerror = (event: unknown) => {
      const e = event as { error?: string };
      if (e.error === "no-speech" || e.error === "aborted") return;
      console.warn("Speech recognition error:", e.error);
    };

    recognition.onend = () => {
      if (wantsRecordingRef.current) {
        try {
          recognition.start();
        } catch {
          wantsRecordingRef.current = false;
          recognitionRef.current = null;
          useSessionStore.getState().setRecording(false);
          useSessionStore.getState().setInterim("");
        }
      } else {
        recognitionRef.current = null;
        useSessionStore.getState().setInterim("");
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      wantsRecordingRef.current = true;
      setRecording(true);
      useSessionStore.getState().markSessionStarted();
    } catch {
      wantsRecordingRef.current = false;
    }
  }, [Ctor, setRecording]);

  const stop = useCallback(() => {
    wantsRecordingRef.current = false;
    recognitionRef.current?.stop();
    setRecording(false);
    useSessionStore.getState().setInterim("");
  }, [setRecording]);

  useEffect(() => {
    return () => {
      wantsRecordingRef.current = false;
      recognitionRef.current?.stop();
    };
  }, []);

  return { isRecording, isSupported, start, stop };
}
