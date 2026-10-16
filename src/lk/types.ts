/** One LegendKeeper page (a "resource" in the API) as stored in a page list. */
export interface PageEntry {
  id: string;
  name: string;
  aliases: string[];
  tags: string[];
  /** Names of the folders above this page, outermost first. */
  path: string[];
  hidden: boolean;
}

/** A page list built by scripts/build-lists.mjs and served next to the extension. */
export interface PageList {
  projectId: string;
  projectName: string;
  isPublic: boolean;
  generatedAt: string;
  /** "public" lists come from a keyless fetch; "gm" lists from the API key. */
  audience: "public" | "gm";
  pages: PageEntry[];
}

/** A token's saved link to a page. */
export interface PageLink {
  resourceId: string;
  name: string;
}
