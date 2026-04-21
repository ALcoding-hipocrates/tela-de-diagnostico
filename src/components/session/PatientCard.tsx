import { mockPatient, type MockVital } from "@/mocks/session";
import { useSessionStore } from "@/store/sessionStore";
import { cn } from "@/lib/cn";

/**
 * Card do paciente com avatar + nome + meta + vitais inline.
 * Live dot verde indica sessão ativa. Estilo mockup Hipócrates.
 */
export function PatientCard() {
  const isRecording = useSessionStore((s) => s.isRecording);
  const sessionStartedAt = useSessionStore((s) => s.sessionStartedAt);
  const vitals = mockPatient.vitals ?? [];
  const active = isRecording || sessionStartedAt !== null;

  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full bg-ink-900 text-[13px] font-bold text-white"
          aria-hidden
        >
          {mockPatient.initials}
        </div>
        {active && (
          <span
            aria-label="Sessão ativa"
            className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-surface"
          >
            <span className="relative flex h-2 w-2">
              <span
                className={cn(
                  "absolute inline-flex h-full w-full rounded-full bg-clinical-glow",
                  isRecording && "animate-ping opacity-70"
                )}
              />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-clinical-glow" />
            </span>
          </span>
        )}
      </div>
      <div className="flex flex-col leading-tight">
        <span className="text-[15px] font-bold tracking-tight text-ink-900">
          {mockPatient.name}
        </span>
        <span className="flex items-center gap-1.5 text-[11px] font-medium text-ink-600">
          <span>{mockPatient.sex === "F" ? "F" : "M"}</span>
          <Sep />
          <span>{mockPatient.age} anos</span>
          <Sep />
          <span className="font-mono text-[10.5px] text-ink-400">
            #{mockPatient.id}
          </span>
          {vitals.length > 0 && (
            <>
              <Sep />
              {vitals.map((v, i) => (
                <VitalChip key={i} vital={v} />
              ))}
            </>
          )}
        </span>
      </div>
    </div>
  );
}

function Sep() {
  return <span className="h-2.5 w-px bg-ink-400/30" aria-hidden />;
}

function VitalChip({ vital }: { vital: MockVital }) {
  const cfg =
    vital.tone === "danger"
      ? "text-danger"
      : vital.tone === "warning"
        ? "text-warning"
        : "text-ink-900";
  return (
    <span className="inline-flex items-baseline gap-0.5">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-400">
        {vital.label}
      </span>
      <span className={cn("font-mono text-[11px] font-bold tabular-nums", cfg)}>
        {vital.value}
      </span>
    </span>
  );
}
