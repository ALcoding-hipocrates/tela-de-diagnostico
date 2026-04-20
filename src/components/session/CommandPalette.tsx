import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  Pill,
  Clock,
  FlaskConical,
  Calculator,
  Sparkles,
  BookOpen,
  Settings,
  UserCircle,
  FileDown,
  Braces,
  UserRound,
  Send,
  Mic,
  PanelRight,
  RotateCcw,
  CornerDownLeft,
} from "lucide-react";
import { useSessionStore } from "@/store/sessionStore";
import { useSpeechRecognition } from "@/lib/useSpeechRecognition";
import { cn } from "@/lib/cn";
import { Kbd } from "./shared/Kbd";

type ActionCategory = "Ações" | "Documentos" | "Painéis";

interface PaletteAction {
  id: string;
  label: string;
  hint?: string;
  category: ActionCategory;
  icon: React.ReactNode;
  run: () => void | Promise<void>;
}

export function CommandPalette() {
  const activeModal = useSessionStore((s) => s.activeModal);
  const closeModal = useSessionStore((s) => s.closeModal);
  const openModal = useSessionStore((s) => s.openModal);
  const toggleDrawer = useSessionStore((s) => s.toggleDrawer);
  const resetSession = useSessionStore((s) => s.resetSession);
  const { isRecording, isSupported, start, stop } = useSpeechRecognition();

  const open = activeModal === "commandPalette";

  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const actions = useMemo<PaletteAction[]>(() => {
    const list: PaletteAction[] = [
      {
        id: "toggle-drawer",
        label: "Abrir / fechar painel",
        category: "Ações",
        icon: <PanelRight size={14} />,
        run: () => {
          closeModal();
          toggleDrawer();
        },
      },
      {
        id: "reset",
        label: "Iniciar nova consulta",
        hint: "Limpa transcrição, hipóteses, prescrições, exames",
        category: "Ações",
        icon: <RotateCcw size={14} />,
        run: () => {
          if (
            window.confirm(
              "Limpar sessão atual? Essa ação não pode ser desfeita."
            )
          ) {
            resetSession();
            closeModal();
          }
        },
      },
    ];

    if (isSupported) {
      list.push({
        id: "mic",
        label: isRecording ? "Parar captura de áudio" : "Iniciar captura de áudio",
        category: "Ações",
        icon: <Mic size={14} />,
        run: () => {
          closeModal();
          setTimeout(() => {
            if (isRecording) stop();
            else start();
          }, 50);
        },
      });
    }

    // Documentos
    list.push(
      {
        id: "export-pdf",
        label: "Exportar SOAP em PDF",
        category: "Documentos",
        icon: <FileDown size={14} />,
        run: async () => {
          closeModal();
          const [{ buildSoap }, { downloadSoapPdf }] = await Promise.all([
            import("@/lib/soap"),
            import("@/lib/soapPdf"),
          ]);
          const s = useSessionStore.getState();
          const base = s.soapSections ?? {
            subjective: "",
            objective: "",
            assessment: "",
            plan: "",
          };
          downloadSoapPdf(
            buildSoap({
              transcript: s.transcript,
              hypotheses: s.hypotheses,
              checklist: s.checklist,
              nextQuestion: s.nextQuestion,
              prescriptions: s.prescriptions,
              narrativeSections: { ...base, ...s.soapEdits },
            })
          );
        },
      },
      {
        id: "export-fhir",
        label: "Exportar FHIR Bundle",
        hint: "Pra Tasy/MV/iClinic/Amplimed",
        category: "Documentos",
        icon: <Braces size={14} />,
        run: async () => {
          closeModal();
          const [{ buildSoap }, { downloadFhirBundle }] = await Promise.all([
            import("@/lib/soap"),
            import("@/lib/soapFhir"),
          ]);
          const s = useSessionStore.getState();
          const base = s.soapSections ?? {
            subjective: "",
            objective: "",
            assessment: "",
            plan: "",
          };
          downloadFhirBundle(
            buildSoap({
              transcript: s.transcript,
              hypotheses: s.hypotheses,
              checklist: s.checklist,
              nextQuestion: s.nextQuestion,
              prescriptions: s.prescriptions,
              narrativeSections: { ...base, ...s.soapEdits },
            })
          );
        },
      },
      {
        id: "avs",
        label: "Gerar orientação ao paciente (AVS)",
        category: "Documentos",
        icon: <UserRound size={14} />,
        run: () => openModal("avs"),
      },
      {
        id: "referral",
        label: "Gerar carta de encaminhamento",
        category: "Documentos",
        icon: <Send size={14} />,
        run: () => openModal("referral"),
      }
    );

    // Painéis
    list.push(
      {
        id: "prescription",
        label: "Abrir prescrição",
        category: "Painéis",
        icon: <Pill size={14} />,
        run: () => openModal("prescription"),
      },
      {
        id: "exams",
        label: "Abrir exames",
        category: "Painéis",
        icon: <FlaskConical size={14} />,
        run: () => openModal("exams"),
      },
      {
        id: "calculators",
        label: "Abrir escalas clínicas",
        hint: "CHA₂DS₂-VASc, CURB-65, Wells, TIMI, PHQ-9",
        category: "Painéis",
        icon: <Calculator size={14} />,
        run: () => openModal("calculators"),
      },
      {
        id: "timeline",
        label: "Abrir timeline da consulta",
        category: "Painéis",
        icon: <Clock size={14} />,
        run: () => openModal("timeline"),
      },
      {
        id: "ai",
        label: "Abrir estado do assistente de IA",
        category: "Painéis",
        icon: <Sparkles size={14} />,
        run: () => openModal("ai"),
      },
      {
        id: "protocols",
        label: "Abrir protocolos e diretrizes",
        category: "Painéis",
        icon: <BookOpen size={14} />,
        run: () => openModal("protocols"),
      },
      {
        id: "settings",
        label: "Abrir configurações",
        category: "Painéis",
        icon: <Settings size={14} />,
        run: () => openModal("settings"),
      },
      {
        id: "account",
        label: "Abrir conta",
        category: "Painéis",
        icon: <UserCircle size={14} />,
        run: () => openModal("account"),
      }
    );

    return list;
  }, [
    closeModal,
    toggleDrawer,
    resetSession,
    openModal,
    isSupported,
    isRecording,
    start,
    stop,
  ]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return actions;
    return actions.filter(
      (a) =>
        a.label.toLowerCase().includes(q) ||
        (a.hint && a.hint.toLowerCase().includes(q)) ||
        a.category.toLowerCase().includes(q)
    );
  }, [query, actions]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeModal();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const action = filtered[selectedIndex];
        if (action) void action.run();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, filtered, selectedIndex, closeModal]);

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(
      `[data-index="${selectedIndex}"]`
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  if (!open) return null;

  const grouped = groupByCategory(filtered);

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center p-6 pt-24">
      <div
        className="animate-fade-in absolute inset-0 bg-ink-900/40"
        aria-hidden
        onClick={closeModal}
      />
      <div
        role="dialog"
        aria-modal
        className="animate-pop-in relative z-10 flex w-full max-w-xl flex-col overflow-hidden rounded-xl border border-black/5 bg-surface shadow-2xl"
      >
        <div className="flex items-center gap-2 border-b border-black/5 px-3 py-2.5">
          <Search size={14} className="shrink-0 text-ink-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar ação ou painel…"
            className="flex-1 bg-transparent text-[14px] font-medium text-ink-900 placeholder:font-medium placeholder:text-ink-400 focus:outline-none"
          />
          <Kbd tone="muted">Esc</Kbd>
        </div>

        {filtered.length === 0 ? (
          <p className="px-4 py-8 text-center text-[13px] italic text-ink-400">
            Nenhuma ação corresponde a "{query}".
          </p>
        ) : (
          <ul
            ref={listRef}
            role="listbox"
            className="max-h-[420px] overflow-y-auto"
          >
            {grouped.map(([category, items]) => {
              const startIndex = filtered.indexOf(items[0]);
              return (
                <li key={category} className="border-b border-black/5 last:border-b-0">
                  <div className="px-3 py-1.5 text-[10px] font-semibold text-ink-400">
                    {category}
                  </div>
                  <ul>
                    {items.map((action, localIdx) => {
                      const globalIdx = startIndex + localIdx;
                      const isSelected = globalIdx === selectedIndex;
                      return (
                        <li
                          key={action.id}
                          data-index={globalIdx}
                          role="option"
                          aria-selected={isSelected}
                        >
                          <button
                            type="button"
                            onMouseEnter={() => setSelectedIndex(globalIdx)}
                            onClick={() => void action.run()}
                            className={cn(
                              "flex w-full items-center gap-3 px-3 py-2 text-left transition-colors",
                              isSelected
                                ? "bg-clinical/[0.06] text-ink-900"
                                : "hover:bg-black/[0.02]"
                            )}
                          >
                            <span
                              className={cn(
                                "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
                                isSelected
                                  ? "bg-clinical/15 text-clinical-700"
                                  : "bg-surface-raised text-ink-600"
                              )}
                            >
                              {action.icon}
                            </span>
                            <div className="flex min-w-0 flex-1 flex-col">
                              <span className="truncate text-[13px] font-semibold text-ink-900">
                                {action.label}
                              </span>
                              {action.hint && (
                                <span className="truncate text-[11px] text-ink-600">
                                  {action.hint}
                                </span>
                              )}
                            </div>
                            {isSelected && (
                              <span className="flex shrink-0 items-center gap-1 font-mono text-[10px] text-ink-400">
                                <CornerDownLeft size={10} />
                              </span>
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              );
            })}
          </ul>
        )}

        <div className="flex items-center gap-3 border-t border-black/5 bg-surface-raised px-3 py-1.5 text-[10.5px] font-medium text-ink-400">
          <span className="flex items-center gap-1.5">
            <Kbd tone="muted">↑↓</Kbd>
            navegar
          </span>
          <span className="flex items-center gap-1.5">
            <Kbd tone="muted">↵</Kbd>
            executar
          </span>
          <span className="ml-auto">
            {filtered.length} ação{filtered.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>
    </div>
  );
}

function groupByCategory(
  actions: PaletteAction[]
): [ActionCategory, PaletteAction[]][] {
  const map = new Map<ActionCategory, PaletteAction[]>();
  for (const a of actions) {
    if (!map.has(a.category)) map.set(a.category, []);
    map.get(a.category)!.push(a);
  }
  return Array.from(map.entries());
}
