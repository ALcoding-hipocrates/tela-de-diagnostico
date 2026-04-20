import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Sparkles, ArrowRight, ArrowLeft, X } from "lucide-react";
import { cn } from "@/lib/cn";

const STORAGE_KEY = "hipocrates:tour-seen-v1";

interface TourStep {
  targetSelector?: string;
  title: string;
  body: string;
  placement?: "top" | "bottom" | "center";
}

const STEPS: TourStep[] = [
  {
    placement: "center",
    title: "Bem-vindo à Sessão Clínica",
    body: "A IA te acompanha durante a consulta — transcreve, raciocina, cita diretrizes e sugere condutas em tempo real. Vou mostrar os pontos-chave em 5 passos.",
  },
  {
    targetSelector: "[data-tour='mic']",
    placement: "top",
    title: "Captura de áudio",
    body: "Clique no microfone pra iniciar a transcrição ao vivo. A IA identifica médico/paciente automaticamente e destaca red flags à medida que surgem.",
  },
  {
    targetSelector: "[data-tour='summary']",
    placement: "bottom",
    title: "Resumo em tempo real",
    body: "Os 4 indicadores (red flag, hipótese principal, cobertura, pendências) se atualizam enquanto a consulta evolui. Clique no red flag pra ver momentos críticos.",
  },
  {
    targetSelector: "[data-tour='drawer']",
    placement: "top",
    title: "Painel de raciocínio",
    body: "Hipóteses com CID-10 e sparkline, ações pendentes e próxima pergunta sugerida. Tudo com fundamentação em diretrizes brasileiras (SBC, ABN, SBEM...). Clique em 'Por que 68%?' pra ver o breakdown ou 'Ver raciocínio' pra explicação completa.",
  },
  {
    targetSelector: "[data-tour='export']",
    placement: "bottom",
    title: "Gere documentos",
    body: "Exporte SOAP em PDF, FHIR Bundle pra prontuários (Tasy/MV/iClinic/Amplimed), resumo pro paciente (AVS) ou carta de encaminhamento — tudo em 1 clique.",
  },
  {
    placement: "center",
    title: "Atalho: Ctrl + K",
    body: "A qualquer momento, pressione Ctrl+K (ou Cmd+K no Mac) pra abrir a paleta de comandos — busque qualquer ação e execute em 2 teclas. Boa consulta!",
  },
];

export function Tour() {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const seen = localStorage.getItem(STORAGE_KEY);
      if (!seen) {
        // Small delay pra tela montar
        const t = setTimeout(() => setActive(true), 600);
        return () => clearTimeout(t);
      }
    } catch {
      /* localStorage indisponível — não mostra */
    }
  }, []);

  useLayoutEffect(() => {
    if (!active) return;
    const current = STEPS[step];
    if (!current.targetSelector) {
      setRect(null);
      return;
    }
    const el = document.querySelector<HTMLElement>(current.targetSelector);
    if (!el) {
      setRect(null);
      return;
    }
    const update = () => setRect(el.getBoundingClientRect());
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [active, step]);

  const dismiss = (permanent: boolean) => {
    if (permanent) {
      try {
        localStorage.setItem(STORAGE_KEY, "1");
      } catch {
        /* ignore */
      }
    }
    setActive(false);
    setStep(0);
  };

  const next = () => {
    if (step >= STEPS.length - 1) {
      dismiss(true);
    } else {
      setStep((s) => s + 1);
    }
  };

  const back = () => setStep((s) => Math.max(0, s - 1));

  if (!active) return null;

  const current = STEPS[step];
  const isCenter = !current.targetSelector || !rect;
  const tooltipPosition = computeTooltipPosition(rect, current.placement);

  return (
    <div className="pointer-events-none fixed inset-0 z-[70]">
      <div
        className="pointer-events-auto absolute inset-0 bg-ink-900/40 animate-fade-in"
        onClick={() => dismiss(false)}
        aria-hidden
      />

      {rect && !isCenter && (
        <div
          aria-hidden
          className="animate-fade-in absolute rounded-lg ring-2 ring-clinical ring-offset-2 ring-offset-transparent transition-all"
          style={{
            top: rect.top - 4,
            left: rect.left - 4,
            width: rect.width + 8,
            height: rect.height + 8,
            boxShadow: "0 0 0 9999px rgba(15, 20, 25, 0.45)",
          }}
        />
      )}

      <div
        ref={tooltipRef}
        role="dialog"
        aria-modal
        className={cn(
          "pointer-events-auto absolute flex w-[360px] flex-col gap-3 rounded-xl border border-black/5 bg-surface p-4 shadow-2xl animate-pop-in"
        )}
        style={tooltipPosition}
      >
        <div className="flex items-start gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-clinical/10 text-clinical-700">
            <Sparkles size={14} />
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-label font-semibold text-ink-400">
              Passo {step + 1} de {STEPS.length}
            </span>
            <h3 className="text-[15px] font-semibold text-ink-900">
              {current.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => dismiss(true)}
            aria-label="Pular tour"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-ink-400 hover:bg-surface-raised hover:text-ink-900"
          >
            <X size={14} />
          </button>
        </div>

        <p className="text-[13px] font-medium leading-snug text-ink-600">
          {current.body}
        </p>

        <div className="flex items-center gap-1">
          <ProgressDots total={STEPS.length} current={step} />
          <div className="ml-auto flex items-center gap-1">
            {step > 0 && (
              <button
                type="button"
                onClick={back}
                className="flex h-7 items-center gap-1 rounded-md px-2 text-[12px] font-semibold text-ink-600 hover:bg-surface-raised hover:text-ink-900"
              >
                <ArrowLeft size={11} /> Voltar
              </button>
            )}
            <button
              type="button"
              onClick={next}
              className="flex h-7 items-center gap-1 rounded-md bg-clinical px-2.5 text-[12px] font-semibold text-white hover:bg-clinical-700"
            >
              {step === STEPS.length - 1 ? "Concluir" : "Próximo"}
              {step < STEPS.length - 1 && <ArrowRight size={11} />}
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => dismiss(true)}
          className="mt-1 text-[11px] font-medium text-ink-400 hover:text-ink-900"
        >
          Pular tour — não mostrar novamente
        </button>
      </div>
    </div>
  );
}

function ProgressDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          aria-hidden
          className={cn(
            "h-1.5 w-1.5 rounded-full transition-colors",
            i === current
              ? "bg-clinical"
              : i < current
                ? "bg-clinical/40"
                : "bg-ink-400/30"
          )}
        />
      ))}
    </div>
  );
}

function computeTooltipPosition(
  rect: DOMRect | null,
  placement?: "top" | "bottom" | "center"
): React.CSSProperties {
  const width = 360;
  const margin = 16;
  const viewportW =
    typeof window !== "undefined" ? window.innerWidth : 1280;
  const viewportH =
    typeof window !== "undefined" ? window.innerHeight : 800;

  if (!rect || placement === "center") {
    return {
      top: `${viewportH / 2 - 120}px`,
      left: `${viewportW / 2 - width / 2}px`,
    };
  }

  const aboveSpace = rect.top;
  const belowSpace = viewportH - rect.bottom;
  const prefersTop =
    placement === "top" || (aboveSpace > belowSpace && aboveSpace > 200);

  let left = rect.left + rect.width / 2 - width / 2;
  left = Math.max(margin, Math.min(left, viewportW - width - margin));

  if (prefersTop) {
    return {
      bottom: `${viewportH - rect.top + 12}px`,
      left: `${left}px`,
    };
  }
  return {
    top: `${rect.bottom + 12}px`,
    left: `${left}px`,
  };
}
