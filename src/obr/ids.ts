export const EXTENSION_ID = "com.groudonmcl.lk-owlbear";

/** Item metadata key holding the GM's PageLink for a token. */
export const LINK_KEY = `${EXTENSION_ID}/link`;

export const PANEL_ID = `${EXTENSION_ID}/panel`;
export const PICKER_ID = `${EXTENSION_ID}/picker`;
export const TAB_ID = `${EXTENSION_ID}/tab`;

/** Absolute URL of one of this extension's pages or assets. */
export function extensionUrl(file: string, params?: Record<string, string>): string {
  const url = new URL(file, document.baseURI);
  for (const [key, value] of Object.entries(params ?? {})) url.searchParams.set(key, value);
  return url.href;
}
