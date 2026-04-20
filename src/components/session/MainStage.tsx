import { Mic } from "lucide-react";
import { useSessionStore } from "@/store/sessionStore";
import { TranscriptFeed } from "./transcript/TranscriptFeed";
import { TranscriptInput } from "./transcript/TranscriptInput";

export function MainStage() {
  const hasMessages = useSessionStore((s) =>
    s.transcript.some((i) => i.kind === "message")
  );

  return (
    <main
      className="flex h-full flex-col bg-surface"
      aria-label="Transcrição da consulta"
    >
      {hasMessages ? <TranscriptFeed /> : <EmptyState />}
      <div className="shrink-0 border-t border-black/[0.04] bg-surface">
        <TranscriptInput />
      </div>
    </main>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="flex max-w-md flex-col items-center gap-3 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-clinical/10 text-clinical-700">
          <Mic size={24} />
        </div>
        <h2 className="text-[16px] font-semibold text-ink-900">
          Pronto pra começar
        </h2>
        <p className="text-[14px] font-medium leading-snug text-ink-600">
          Clique no microfone abaixo pra iniciar a captura de áudio da consulta,
          ou digite uma fala pra simular. A IA começa a analisar automaticamente
          após algumas mensagens.
        </p>
      </div>
    </div>
  );
}
