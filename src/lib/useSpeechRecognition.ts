import { useCallback, useEffect, useRef } from "react";
import { useSessionStore } from "@/store/sessionStore";
import { nextTimestamp } from "./sessionSelectors";
import { detectRedFlags } from "./redFlagDetection";
import {
  classifyMacro,
  extractCommand,
  isMacroConfigured,
  type MacroAction,
} from "./voiceMacros";

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

async function handleMacro(command: string): Promise<void> {
  const store = useSessionStore.getState();
  store.pushToast({
    tone: "info",
    title: "Comando recebido",
    description: `"${command}"`,
  });
  try {
    const result = await classifyMacro(command);
    executeMacroAction(result.action);
    store.pushToast({
      tone: "success",
      title: "Comando executado",
      description: result.confirmation,
    });
  } catch (e) {
    store.pushToast({
      tone: "danger",
      title: "Falha no comando",
      description: e instanceof Error ? e.message : "Não entendi.",
    });
  }
}

function executeMacroAction(a: MacroAction): void {
  const store = useSessionStore.getState();
  switch (a.kind) {
    case "add_prescription":
      if (a.medication) {
        store.addPrescription({
          medicationId: `voice-${Date.now()}`,
          medicationName: a.medication,
          medicationClass: "—",
          dose: a.dose ?? "—",
          route: "oral",
          frequency: a.frequency ?? "—",
          duration: a.duration ?? "—",
          status: "new",
        });
      }
      break;
    case "request_exams":
      if (a.panels && a.panels.length > 0) {
        for (const name of a.panels) {
          store.addExam({
            panelId: name.toLowerCase().replace(/\s+/g, "-"),
            panelName: name,
          });
        }
      }
      break;
    case "check_item":
      if (a.label) {
        const match = store.checklist.find((c) =>
          c.label.toLowerCase().includes(a.label!.toLowerCase())
        );
        if (match) {
          store.checkItem(match.id, a.result);
        }
      }
      break;
    case "verify_assumption":
      if (a.text) {
        const hypotheses = a.icd10
          ? store.hypotheses.filter((h) => h.icd10 === a.icd10)
          : store.hypotheses;
        for (const h of hypotheses) {
          const match = h.assumptions?.find((as) =>
            as.text.toLowerCase().includes(a.text!.toLowerCase())
          );
          if (match) {
            store.setAssumptionState(h.icd10, match.id, a.state);
          }
        }
      }
      break;
    case "mark_red_flag":
      // Add a message marking the red flag trigger
      store.addMessage({
        speaker: "doctor",
        text: `[Red flag marcado por voz: ${a.label}]`,
        timestampSec: nextTimestamp(store.transcript, 2),
      });
      break;
    case "unknown":
      // Fallback: add raw as a doctor note
      store.addMessage({
        speaker: "doctor",
        text: a.raw,
        timestampSec: nextTimestamp(store.transcript, 2),
      });
      break;
  }
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
            // M7: se começa com wake word, é comando de voz
            const command = extractCommand(text);
            if (command && isMacroConfigured()) {
              void handleMacro(command);
              continue;
            }
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
