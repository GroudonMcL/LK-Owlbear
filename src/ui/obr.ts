import OBR from "@owlbear-rodeo/sdk";
import type { Theme } from "@owlbear-rodeo/sdk";
import { useEffect, useState } from "react";

/** True once the Owlbear SDK is ready; also keeps CSS variables in step with Owlbear's theme. */
export function useObrReady(): boolean {
  const [ready, setReady] = useState(OBR.isReady);
  useEffect(() => {
    if (OBR.isReady) setReady(true);
    else OBR.onReady(() => setReady(true));
  }, []);
  useEffect(() => {
    if (!ready) return;
    OBR.theme.getTheme().then(applyTheme);
    return OBR.theme.onChange(applyTheme);
  }, [ready]);
  return ready;
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.dataset.theme = theme.mode === "LIGHT" ? "light" : "dark";
  root.style.setProperty("--bg", theme.background.paper);
  root.style.setProperty("--bg-default", theme.background.default);
  root.style.setProperty("--text", theme.text.primary);
  root.style.setProperty("--text-muted", theme.text.secondary);
  root.style.setProperty("--accent", theme.primary.main);
  root.style.setProperty("--accent-text", theme.primary.contrastText);
}

export function searchParam(name: string): string {
  return new URLSearchParams(window.location.search).get(name) ?? "";
}
