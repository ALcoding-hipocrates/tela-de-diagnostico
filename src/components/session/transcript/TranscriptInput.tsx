import { useState } from "react";
import { Send, Mic } from "lucide-react";
import { useSessionStore } from "@/store/sessionStore";
import { nextTimestamp } from "@/lib/sessionSelectors";
import { detectRedFlags } from "@/lib/redFlagDetection";

export function TranscriptInput() {
  const [text, setText] = useState("");
  const addMessage = useSessionStore((s) => s.addMessage);
  const isRecording = useSessionStore((s) => s.isRecording);

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const transcript = useSessionStore.getState().transcript;
    addMessage({
      speaker: "doctor",
      text: trimmed,
      timestampSec: nextTimestamp(transcript, 10),
      redFlags: detectRedFlags(trimmed),
      autoLabeled: true,
    });
    setText("");
  };

  if (isRecording) {
    return (
      <div className="mx-auto flex w-full max-w-3xl items-center justify-center gap-2 px-6 py-3">
        <div className="flex items-center gap-2 rounded-full border border-danger/20 bg-danger/5 px-3 py-1.5">
          <Mic size={12} className="text-danger" />
          <span className="text-label font-semibold text-danger">
            capturando ao vivo
          </span>
          <span className="text-label text-ink-600">
            · auto-rotulando — clique em Méd/Pac pra corrigir
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl items-center gap-2 px-6 py-3">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        placeholder="Simular fala capturada pelo microfone…"
        className="flex-1 rounded-md border border-black/10 bg-surface px-3 py-2 text-[14px] font-medium text-ink-900 placeholder:font-medium placeholder:text-ink-400 focus:border-clinical/40 focus:outline-none focus:ring-2 focus:ring-clinical/25"
      />
      <button
        type="button"
        onClick={submit}
        disabled={!text.trim()}
        aria-label="Enviar"
        className="flex h-10 w-10 items-center justify-center rounded-md bg-clinical text-white transition-colors hover:bg-clinical-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Send size={16} />
      </button>
    </div>
  );
}
