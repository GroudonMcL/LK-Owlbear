import OBR from "@owlbear-rodeo/sdk";
import { StrictMode, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import type { Role } from "../lk/lists";
import { searchPages } from "../lk/match";
import type { PageEntry, PageLink, PageList } from "../lk/types";
import { LINK_KEY, PICKER_ID } from "../obr/ids";
import { notify, openPage, roleAndList, saveLink, type PickerMode } from "../obr/open";
import { asPageLink, getPlayerLink } from "../storage";
import { searchParam, useObrReady } from "../ui/obr";
import { MISSING_LISTS_MESSAGE } from "../lk/lists";
import "../ui/styles.css";

const itemId = searchParam("item");
const mode = (searchParam("mode") || "open") as PickerMode;

function Picker() {
  const ready = useObrReady();
  const [query, setQuery] = useState(searchParam("q"));
  const [role, setRole] = useState<Role>();
  const [list, setList] = useState<PageList | null>();
  const [current, setCurrent] = useState<{ link: PageLink; by: "gm" | "player" }>();

  useEffect(() => {
    if (!ready) return;
    (async () => {
      const [r, l] = await roleAndList();
      setRole(r);
      setList(l ?? null);
      const [item] = await OBR.scene.items.getItems([itemId]);
      const gmLink = item ? asPageLink(item.metadata[LINK_KEY]) : undefined;
      const playerLink = r === "PLAYER" ? getPlayerLink(OBR.room.id, itemId) : undefined;
      if (gmLink) setCurrent({ link: gmLink, by: "gm" });
      else if (playerLink) setCurrent({ link: playerLink, by: "player" });
    })().catch((error) => notify(String(error), "ERROR"));
  }, [ready]);

  // A player can't change a link the GM saved on the token; their choice only opens a page.
  const gmLocked = role === "PLAYER" && current?.by === "gm";

  const results = useMemo(() => (list ? searchPages(list.pages, query) : []), [list, query]);
  const close = () => OBR.modal.close(PICKER_ID);

  const choose = async (page: PageEntry) => {
    if (!role || !list) return;
    const link = { resourceId: page.id, name: page.name };
    if (!gmLocked) await saveLink(role, itemId, link);
    await openPage(list, role, link);
    await close();
  };

  const unlink = async () => {
    if (!role) return;
    await saveLink(role, itemId, undefined);
    await close();
  };

  return (
    <div className="stack" style={{ height: "100%", background: "var(--bg)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <h1 style={{ flex: 1 }}>{mode === "link" ? "Link LK Page" : "Choose LK Page"}</h1>
        <button onClick={close} aria-label="Close">
          ✕
        </button>
      </div>

      {current && (
        <div className="muted" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ flex: 1 }}>
            Linked to “{current.link.name}”{gmLocked ? " by the GM" : ""}
          </span>
          {!gmLocked && mode === "link" && <button onClick={unlink}>Unlink</button>}
        </div>
      )}

      <input
        type="search"
        autoFocus
        placeholder="Search pages by name, alias, tag or folder"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && results[0]) void choose(results[0]);
          if (e.key === "Escape") void close();
        }}
      />

      {role === "GM" && list?.audience === "public" && (
        <p className="muted">Hidden pages aren't included: the GM list wasn't built.</p>
      )}

      <div style={{ flex: 1, overflowY: "auto", margin: "0 -8px" }}>
        {list === null && <p className="notice">{MISSING_LISTS_MESSAGE}</p>}
        {list && query.trim() && results.length === 0 && (
          <p className="muted" style={{ padding: 8 }}>
            No pages match “{query.trim()}”.
          </p>
        )}
        {results.map((page) => (
          <Result key={page.id} page={page} showHidden={role === "GM"} onChoose={() => void choose(page)} />
        ))}
      </div>
    </div>
  );
}

function Result({ page, showHidden, onChoose }: { page: PageEntry; showHidden: boolean; onChoose: () => void }) {
  return (
    <button
      onClick={onChoose}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        width: "100%",
        border: 0,
        borderRadius: 8,
        padding: "8px",
        whiteSpace: "normal",
        textAlign: "left",
        gap: 2,
      }}
    >
      <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <span>{page.name}</span>
        {showHidden && page.hidden && <span className="badge">Hidden</span>}
      </span>
      {(page.path.length > 0 || page.aliases.length > 0) && (
        <span className="muted">
          {page.path.join(" / ")}
          {page.path.length > 0 && page.aliases.length > 0 ? " · " : ""}
          {page.aliases.length > 0 ? `aka ${page.aliases.join(", ")}` : ""}
        </span>
      )}
    </button>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Picker />
  </StrictMode>,
);
