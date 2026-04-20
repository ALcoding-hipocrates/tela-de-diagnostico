import { useEffect, useState } from "react";
import { Brain } from "lucide-react";

const MESSAGES = [
  "Analisando transcrição",
  "Correlacionando diretrizes",
  "Calculando confiança bayesiana",
  "Identificando red flags",
  "Revisando hipóteses",
];

const INTERVAL_MS = 1500;

export function AnalyzingIndicator() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setIdx((v) => (v + 1) % MESSAGES.length);
    }, INTERVAL_MS);
    return () => window.clearInterval(id);
  }, []);

  return (
    <span
      className="flex items-center gap-1.5 text-label font-medium text-clinical-700"
      title="Claude Opus 4.7 re-analisando a consulta"
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-clinical opacity-70" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-clinical" />
      </span>
      <Brain size={11} className="shrink-0 text-clinical" aria-hidden />
      <span key={idx} className="animate-fade-in tabular-nums">
        {MESSAGES[idx]}…
      </span>
    </span>
  );
}
