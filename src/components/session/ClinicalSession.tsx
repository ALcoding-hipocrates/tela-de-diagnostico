import { useEffect } from "react";
import { useClinicalAi } from "@/lib/useClinicalAi";
import { useSessionStore } from "@/store/sessionStore";
import { mockPatient } from "@/mocks/session";
import { TopBar } from "./TopBar";
import { SummaryBar } from "./SummaryBar";
import { MainStage } from "./MainStage";
import { BottomBar } from "./BottomBar";
import { Drawer } from "./Drawer";
import { CommandPalette } from "./CommandPalette";
import { Tour } from "./Tour";
import { ToastHost } from "./shared/ToastHost";

/**
 * Layout clássico com Drawer retrátil à direita.
 *   TopBar
 *   SummaryBar
 *   [ MainStage | Drawer (retractable right) ]
 *   BottomBar
 */
export function ClinicalSession() {
  useClinicalAi();
  const isRecording = useSessionStore((s) => s.isRecording);
  const openModal = useSessionStore((s) => s.openModal);
  const activeModal = useSessionStore((s) => s.activeModal);
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
    <div className="flex h-full flex-col">
      <TopBar />
      <SummaryBar />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex min-w-0 flex-1 flex-col">
          <MainStage />
        </div>
        <Drawer />
      </div>
      <BottomBar />
      <CommandPalette />
      <Tour />
      <ToastHost />
    </div>
  );
}
