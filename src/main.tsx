import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Aplica modo escuro antes do React montar pra evitar flash de tema claro
try {
  if (localStorage.getItem("hipocrates:dark-mode") === "1") {
    document.documentElement.classList.add("dark");
  }
} catch {
  /* ignore */
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
