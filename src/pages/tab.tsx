import OBR from "@owlbear-rodeo/sdk";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { TAB_ID } from "../obr/ids";
import { searchParam, useObrReady } from "../ui/obr";
import "../ui/styles.css";

const url = searchParam("url");
const name = searchParam("name");
const safeUrl = url.startsWith("https://www.legendkeeper.com/") ? url : "";

// Shown when the browser blocked opening a tab straight from the context menu.
function Tab() {
  useObrReady();
  const close = () => OBR.modal.close(TAB_ID);
  return (
    <div className="stack" style={{ height: "100%", background: "var(--bg)" }}>
      <p>Open “{name}” in a new tab?</p>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button onClick={close}>Cancel</button>
        <a className="button primary" href={safeUrl} target="_blank" rel="noopener" onClick={() => void close()}>
          Open page
        </a>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Tab />
  </StrictMode>,
);
