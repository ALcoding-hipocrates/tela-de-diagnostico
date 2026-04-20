import { useMemo, useState } from "react";
import { BookOpen, Search } from "lucide-react";
import { guidelines, type GuidelineSource } from "@/data/guidelines";
import { cn } from "@/lib/cn";
import { Modal } from "../shared/Modal";

interface ProtocolsModalProps {
  open: boolean;
  onClose: () => void;
}

const SOURCES: GuidelineSource[] = [
  "SBC",
  "ABN",
  "SBEM",
  "SBD",
  "SBPT",
  "ABP",
  "FEBRASGO",
  "SBIM",
  "ESC",
  "AHA",
  "NICE",
];

export function ProtocolsModal({ open, onClose }: ProtocolsModalProps) {
  const [query, setQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<GuidelineSource | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return guidelines.filter((g) => {
      if (sourceFilter && g.source !== sourceFilter) return false;
      if (!q) return true;
      return (
        g.title.toLowerCase().includes(q) ||
        g.excerpt.toLowerCase().includes(q) ||
        g.conditions.some((c) => c.toLowerCase().includes(q))
      );
    });
  }, [query, sourceFilter]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Protocolos e diretrizes"
      description="Biblioteca de guidelines clínicos consultáveis — SBC, ABN, SBEM, ESC, AHA, NICE."
    >
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
            aria-hidden
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por condição, termo ou CID-10"
            className="w-full rounded-md border border-black/10 bg-surface py-2.5 pl-9 pr-3 text-[14px] font-medium text-ink-900 placeholder:font-medium placeholder:text-ink-400 focus:border-clinical focus:outline-none focus:ring-2 focus:ring-clinical/25"
          />
        </div>

        <div className="flex flex-wrap gap-1">
          <FilterPill
            active={sourceFilter === null}
            onClick={() => setSourceFilter(null)}
          >
            Todas
          </FilterPill>
          {SOURCES.map((s) => (
            <FilterPill
              key={s}
              active={sourceFilter === s}
              onClick={() => setSourceFilter((cur) => (cur === s ? null : s))}
            >
              {s}
            </FilterPill>
          ))}
        </div>

        <div className="text-label font-medium text-ink-400">
          {filtered.length} resultado{filtered.length === 1 ? "" : "s"}
        </div>

        {filtered.length === 0 ? (
          <p className="rounded-lg border border-dashed border-black/10 py-6 text-center text-[13px] italic text-ink-400">
            Nenhum protocolo encontrado.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {filtered.map((g) => (
              <li
                key={g.id}
                className="rounded-lg border border-black/[0.08] bg-surface p-4 transition-colors hover:border-black/[0.14]"
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 shrink-0 text-ink-600">
                    <BookOpen size={16} />
                  </span>
                  <div className="flex min-w-0 flex-col gap-1">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="font-mono text-label font-semibold text-clinical-700">
                        {g.source} {g.year} · {g.section}
                      </span>
                      <span
                        className="rounded-full bg-surface-raised px-1.5 py-0.5 text-label font-semibold text-ink-600"
                      >
                        {g.authority}
                      </span>
                    </div>
                    <h4 className="text-[14px] font-semibold text-ink-900">
                      {g.title}
                    </h4>
                    <p className="text-[13px] font-medium leading-snug text-ink-600">
                      {g.excerpt}
                    </p>
                    {g.conditions.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {g.conditions.map((c) => (
                          <span
                            key={c}
                            className="rounded-full border border-black/[0.06] bg-surface-raised px-2 py-0.5 font-mono text-[10px] font-medium text-ink-600"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}

function FilterPill({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1 text-[12px] font-semibold transition-colors",
        active
          ? "bg-ink-900 text-white"
          : "bg-surface-raised text-ink-600 hover:bg-black/[0.06] hover:text-ink-900"
      )}
    >
      {children}
    </button>
  );
}
