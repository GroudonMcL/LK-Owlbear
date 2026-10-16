import { EXTENSION_ID } from "./obr/ids";
import type { PageLink } from "./lk/types";

// Per-browser settings. Every read and write tolerates storage being unavailable
// (private windows, blocked site data), falling back to defaults.

export type OpenMode = "panel" | "tab";

const OPEN_MODE_KEY = `${EXTENSION_ID}/open-mode`;
const playerLinksKey = (roomId: string) => `${EXTENSION_ID}/player-links/${roomId}`;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage unavailable: the choice lasts only for this page load.
  }
}

export function getOpenMode(): OpenMode {
  return read<OpenMode>(OPEN_MODE_KEY, "panel") === "tab" ? "tab" : "panel";
}

export function setOpenMode(mode: OpenMode): void {
  write(OPEN_MODE_KEY, mode);
}

/** A player's own token links, kept only in their browser. */
export function getPlayerLink(roomId: string, itemId: string): PageLink | undefined {
  return asPageLink(read<Record<string, unknown>>(playerLinksKey(roomId), {})[itemId]);
}

export function setPlayerLink(roomId: string, itemId: string, link: PageLink | undefined): void {
  const links = read<Record<string, PageLink>>(playerLinksKey(roomId), {});
  if (link) links[itemId] = link;
  else delete links[itemId];
  write(playerLinksKey(roomId), links);
}

/** Accepts only a well-formed PageLink, since metadata and storage hold untyped data. */
export function asPageLink(value: unknown): PageLink | undefined {
  if (typeof value !== "object" || value === null) return undefined;
  const { resourceId, name } = value as Record<string, unknown>;
  return typeof resourceId === "string" && resourceId && typeof name === "string"
    ? { resourceId, name }
    : undefined;
}
