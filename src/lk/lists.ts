import type { PageList } from "./types";

export type Role = "GM" | "PLAYER";

/**
 * The page list for a role: the GM gets gm.json (hidden pages included) when it
 * was built, otherwise everyone gets public.json. Undefined when neither exists.
 */
export async function loadPageList(role: Role): Promise<PageList | undefined> {
  if (role === "GM") {
    const gm = await fetchList("gm");
    if (gm) return gm;
  }
  return fetchList("public");
}

async function fetchList(name: "gm" | "public"): Promise<PageList | undefined> {
  try {
    const res = await fetch(new URL(`lk/${name}.json`, document.baseURI), { cache: "no-cache" });
    return res.ok ? ((await res.json()) as PageList) : undefined;
  } catch {
    return undefined;
  }
}

export const MISSING_LISTS_MESSAGE =
  "LegendKeeper Link: page lists not found. Run the Deploy workflow on GitHub.";
