import { useEffect } from "react";
import { useClinicalAi } from "@/lib/useClinicalAi";
import { useSessionStore } from "@/store/sessionStore";
import { mockPatient } from "@/mocks/session";
import { LeftRail } from "./LeftRail";
import { MainSession } from "./MainSession";
import { RightPanel } from "./RightPanel";
import { CommandPalette } from "./CommandPalette";
import { Tour } from "./Tour";
import { ToastHost } from "./shared/ToastHost";
import { SettingsModal } from "./modals/SettingsModal";
import { AccountModal } from "./modals/AccountModal";
import { DocumentModal } from "./modals/DocumentModal";
import { HandoffModal } from "./modals/HandoffModal";
import { AuditModal } from "./modals/AuditModal";
import { PreBriefModal } from "./modals/PreBriefModal";
import { TimelineModal } from "./modals/TimelineModal";
import { AiModal } from "./modals/AiModal";
import { PrescriptionModal } from "./modals/PrescriptionModal";
import { ExamsModal } from "./modals/ExamsModal";
import { ProtocolsModal } from "./modals/ProtocolsModal";
import { CalculatorsModal } from "./modals/CalculatorsModal";

/**
 * 3-zone editorial layout (estilo Stitch mockup + DeepScribe):
 *   [LeftRail 88px] [Main flex-1] [RightPanel 440px]
 *   + FloatingControls overlay no bottom do Main
 *   + Modais acessíveis via shortcuts e botões
 */
export function ClinicalSession() {
  useClinicalAi();
  const isRecording = useSessionStore((s) => s.isRecording);
  const openModal = useSessionStore((s) => s.openModal);
  const activeModal = useSessionStore((s) => s.activeModal);
  const closeModal = useSessionStore((s) => s.closeModal);
  const darkMode = useSessionStore((s) => s.darkMode);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) root.classList.add("dark");
    else root.classList.remove("dark");
  }, [darkMode]);

  useEffect(() => {
    const state = isRecording ? "gravando" : "Sessão clínica";
    document.title = `Hipócrates.ai · ${mockPatient.name} · ${state}`;
  }, [isRecording]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isEditing =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        openModal("commandPalette");
        return;
      }
      if (e.key === "/" && !isEditing && activeModal !== "commandPalette") {
        e.preventDefault();
        openModal("commandPalette");
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [openModal, activeModal]);

  return (
    <div className="flex h-full">
      <LeftRail />
      <MainSession />
      <RightPanel />

      {/* Overlays globais */}
      <CommandPalette />
      <Tour />
      <ToastHost />

      {/* Modais */}
      <SettingsModal open={activeModal === "settings"} onClose={closeModal} />
      <AccountModal open={activeModal === "account"} onClose={closeModal} />
      <DocumentModal
        open={activeModal === "avs"}
        onClose={closeModal}
        kind="avs"
      />
      <DocumentModal
        open={activeModal === "referral"}
        onClose={closeModal}
        kind="referral"
      />
      <HandoffModal open={activeModal === "handoff"} onClose={closeModal} />
      <AuditModal open={activeModal === "audit"} onClose={closeModal} />
      <PreBriefModal open={activeModal === "preBrief"} onClose={closeModal} />
      <TimelineModal open={activeModal === "timeline"} onClose={closeModal} />
      <AiModal open={activeModal === "ai"} onClose={closeModal} />
      <PrescriptionModal
        open={activeModal === "prescription"}
        onClose={closeModal}
      />
      <ExamsModal open={activeModal === "exams"} onClose={closeModal} />
      <ProtocolsModal open={activeModal === "protocols"} onClose={closeModal} />
      <CalculatorsModal
        open={activeModal === "calculators"}
        onClose={closeModal}
      />
    </div>
  );
}
