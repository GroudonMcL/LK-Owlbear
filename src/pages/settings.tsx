import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { loadPageList, type Role } from "../lk/lists";
import type { PageList } from "../lk/types";
import { getOpenMode, setOpenMode, type OpenMode } from "../storage";
import { useObrReady } from "../ui/obr";
import OBR from "@owlbear-rodeo/sdk";
import "../ui/styles.css";

const WORKFLOW_URL = "https://github.com/GroudonMcL/LK-Owlbear/actions/workflows/deploy.yml";

function Settings() {
  const ready = useObrReady();
  const [mode, setMode] = useState<OpenMode>(getOpenMode);
  const [role, setRole] = useState<Role>();
  const [list, setList] = useState<PageList | null>();

  useEffect(() => {
    if (!ready) return;
    OBR.player.getRole().then(async (r) => {
      setRole(r);
      setList((await loadPageList(r)) ?? null);
    });
  }, [ready]);

  const choose = (next: OpenMode) => {
    setOpenMode(next);
    setMode(next);
  };

  const panelAvailable = list?.isPublic !== false;

  return (
    <div className="stack">
      <h1>LegendKeeper Link</h1>

      <fieldset style={{ border: 0, padding: 0, margin: 0, display: "grid", gap: 8 }}>
        <legend className="muted" style={{ marginBottom: 8 }}>
          Open pages in
        </legend>
        <label style={{ opacity: panelAvailable ? 1 : 0.5 }}>
          <input
            type="radio"
            name="mode"
            checked={mode === "panel" && panelAvailable}
            disabled={!panelAvailable}
            onChange={() => choose("panel")}
          />{" "}
          Owlbear panel
        </label>
        <label>
          <input
            type="radio"
            name="mode"
            checked={mode === "tab" || !panelAvailable}
            onChange={() => choose("tab")}
          />{" "}
          New tab
        </label>
      </fieldset>

      {!panelAvailable && (
        <p className="notice">
          This project is private, so it has no public view to show in Owlbear. Pages open in a new tab.
        </p>
      )}

      <ListStatus role={role} list={list} />
    </div>
  );
}

function ListStatus({ role, list }: { role?: Role; list?: PageList | null }) {
  if (list === undefined) return <p className="muted">Loading page list…</p>;
  if (list === null) {
    return (
      <p className="notice">
        No page list found. {role === "GM" ? <RefreshHint /> : "Ask your GM to set up the extension."}
      </p>
    );
  }
  const hidden = list.pages.filter((p) => p.hidden).length;
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <p className="muted">
        {list.projectName}: {list.pages.length} pages
        {role === "GM" && list.audience === "gm" ? `, ${hidden} hidden` : ""}. Updated{" "}
        {new Date(list.generatedAt).toLocaleString()}.
      </p>
      {role === "GM" && list.audience === "public" && (
        <p className="muted">Hidden pages aren't searchable: the GM list wasn't built (no LK_API_KEY secret).</p>
      )}
      {role === "GM" && (
        <p className="muted">
          New pages show up after the next deploy. <RefreshHint />
        </p>
      )}
    </div>
  );
}

function RefreshHint() {
  return (
    <a href={WORKFLOW_URL} target="_blank" rel="noopener" style={{ color: "var(--accent)" }}>
      Run the Deploy workflow
    </a>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Settings />
  </StrictMode>,
);
