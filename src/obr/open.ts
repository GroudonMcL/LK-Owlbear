import OBR from "@owlbear-rodeo/sdk";
import type { Item } from "@owlbear-rodeo/sdk";
import { loadPageList, MISSING_LISTS_MESSAGE, type Role } from "../lk/lists";
import { resolveToken } from "../lk/match";
import type { PageLink, PageList } from "../lk/types";
import { tabUrl } from "../lk/urls";
import { asPageLink, getOpenMode, getPlayerLink, setPlayerLink } from "../storage";
import { extensionUrl, LINK_KEY, PANEL_ID, PICKER_ID, TAB_ID } from "./ids";
import { tokenLabel } from "./token";

const PANEL_WIDTH = 440;
const PANEL_MARGIN = 8;

/** "Open LK Page": open the token's page, or the picker when it can't be decided. */
export async function openForToken(item: Item): Promise<void> {
  const [role, list] = await roleAndList();
  if (!list) return notify(MISSING_LISTS_MESSAGE, "ERROR");

  const label = tokenLabel(item);
  const resolution = resolveToken({
    gmLink: asPageLink(item.metadata[LINK_KEY]),
    playerLink: role === "PLAYER" ? getPlayerLink(OBR.room.id, item.id) : undefined,
    label,
    name: item.name,
    pages: list.pages,
  });

  switch (resolution.kind) {
    case "linked":
      return openPage(list, role, resolution.link);
    case "matched":
      return openPage(list, role, { resourceId: resolution.page.id, name: resolution.page.name });
    case "pick":
      return openPicker(item.id, resolution.query, "open");
  }
}

/** "Link LK Page…": always ask, starting from the label (or the name). */
export async function linkToken(item: Item): Promise<void> {
  return openPicker(item.id, tokenLabel(item) || item.name, "link");
}

export type PickerMode = "open" | "link";

export async function openPicker(itemId: string, query: string, mode: PickerMode): Promise<void> {
  await OBR.modal.open({
    id: PICKER_ID,
    url: extensionUrl("picker.html", { item: itemId, q: query, mode }),
    width: 480,
    height: 600,
  });
}

/** Saves a token's link: on the token for the GM, in this browser for a player. */
export async function saveLink(role: Role, itemId: string, link: PageLink | undefined): Promise<void> {
  if (role === "PLAYER") {
    setPlayerLink(OBR.room.id, itemId, link);
    return;
  }
  await OBR.scene.items.updateItems([itemId], (items) => {
    for (const item of items) {
      if (link) item.metadata[LINK_KEY] = { ...link };
      else delete item.metadata[LINK_KEY];
    }
  });
}

/** Opens a page in this user's chosen place, applying the visibility rules. */
export async function openPage(list: PageList, role: Role, link: PageLink): Promise<void> {
  const entry = list.pages.find((page) => page.id === link.resourceId);

  // Public lists hold every page an anonymous visitor can see, so a missing one isn't public.
  if (role === "PLAYER" && list.isPublic && !entry) {
    return notify(`"${link.name}" isn't public, so it can't be shown to players.`, "WARNING");
  }

  const mode = list.isPublic ? getOpenMode() : "tab";
  if (mode === "panel") {
    return openPanel(list, link, entry?.hidden ?? false);
  }
  return openInTab(tabUrl(role, list.projectId, link.resourceId, list.isPublic), link.name);
}

async function openPanel(list: PageList, link: PageLink, hidden: boolean): Promise<void> {
  const [width, height] = await Promise.all([OBR.viewport.getWidth(), OBR.viewport.getHeight()]);
  const url = extensionUrl("panel.html", {
    project: list.projectId,
    resource: link.resourceId,
    name: link.name,
    ...(hidden ? { hidden: "1" } : {}),
  });
  // Re-opening replaces whatever the panel was showing.
  await OBR.popover.close(PANEL_ID);
  await OBR.popover.open({
    id: PANEL_ID,
    url,
    width: Math.min(PANEL_WIDTH, width - 2 * PANEL_MARGIN),
    height: height - 2 * PANEL_MARGIN,
    anchorReference: "POSITION",
    anchorPosition: { left: width - PANEL_MARGIN, top: PANEL_MARGIN },
    anchorOrigin: { horizontal: "RIGHT", vertical: "TOP" },
    transformOrigin: { horizontal: "RIGHT", vertical: "TOP" },
    disableClickAway: true,
    marginThreshold: 0,
  });
}

/**
 * Opens a URL in a new tab. A context menu click doesn't count as a click inside
 * this extension's frame, so the browser may block the popup; then a small
 * dialog offers a button to click instead.
 */
export async function openInTab(url: string, name: string): Promise<void> {
  const opened = window.open(url, "_blank");
  if (opened) {
    opened.opener = null;
    return;
  }
  await OBR.modal.open({
    id: TAB_ID,
    url: extensionUrl("tab.html", { url, name }),
    width: 360,
    height: 160,
  });
}

export async function roleAndList(): Promise<[Role, PageList | undefined]> {
  const role = await OBR.player.getRole();
  return [role, await loadPageList(role)];
}

export async function notify(message: string, variant: "ERROR" | "WARNING" | "INFO"): Promise<void> {
  await OBR.notification.show(message, variant);
}
