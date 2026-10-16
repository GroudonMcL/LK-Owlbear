import OBR from "@owlbear-rodeo/sdk";
import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import type { Role } from "../lk/lists";
import { publicPageUrl, tabUrl } from "../lk/urls";
import { PANEL_ID } from "../obr/ids";
import { searchParam, useObrReady } from "../ui/obr";
import "../ui/styles.css";

const projectId = searchParam("project");
const resourceId = searchParam("resource");
const name = searchParam("name");
const hidden = searchParam("hidden") === "1";

function Panel() {
  const ready = useObrReady();
  const [role, setRole] = useState<Role>("PLAYER");

  useEffect(() => {
    if (ready) void OBR.player.getRole().then(setRole);
  }, [ready]);

  // The panel only opens for public projects, so the new-tab rule uses isPublic = true.
  const fullPageUrl = tabUrl(role, projectId, resourceId, true);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--bg)" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 8px 8px 12px",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <h1 style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={name}>
          {name}
        </h1>
        <a className="button" href={fullPageUrl} target="_blank" rel="noopener">
          Open in LegendKeeper
        </a>
        <button onClick={() => OBR.popover.close(PANEL_ID)} aria-label="Close panel">
          ✕
        </button>
      </header>

      {hidden ? (
        <div className="stack">
          <p className="notice">
            “{name}” is hidden, so LegendKeeper's public view can't show it here. Open it in LegendKeeper instead.
          </p>
        </div>
      ) : (
        <iframe
          title={name}
          src={publicPageUrl(projectId, resourceId)}
          style={{ flex: 1, width: "100%", border: 0, background: "var(--bg-default)" }}
        />
      )}
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Panel />
  </StrictMode>,
);
