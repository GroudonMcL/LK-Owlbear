import OBR from "@owlbear-rodeo/sdk";
import type { Item } from "@owlbear-rodeo/sdk";
import { EXTENSION_ID, extensionUrl } from "./obr/ids";
import { linkToken, notify, openForToken } from "./obr/open";
import { isToken, TOKEN_FILTER } from "./obr/token";

const filter = { min: 1, max: 1, every: TOKEN_FILTER };

function run(action: (item: Item) => Promise<void>) {
  return ({ items }: { items: Item[] }) => {
    const item = items[0];
    if (items.length !== 1 || !isToken(item)) return;
    action(item).catch((error: unknown) => {
      console.error(error);
      void notify(`LegendKeeper Link: ${String(error)}`, "ERROR");
    });
  };
}

OBR.onReady(() => {
  OBR.contextMenu.create({
    id: `${EXTENSION_ID}/open`,
    icons: [{ icon: extensionUrl("icon.svg"), label: "Open LK Page", filter }],
    onClick: run(openForToken),
  });
  OBR.contextMenu.create({
    id: `${EXTENSION_ID}/link`,
    icons: [{ icon: extensionUrl("link.svg"), label: "Link LK Page…", filter }],
    onClick: run(linkToken),
  });
});
