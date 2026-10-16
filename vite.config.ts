import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";
import pkg from "./package.json" with { type: "json" };

const PAGES = ["index", "background", "picker", "panel", "tab"];
const DEFAULT_SITE_URL = "https://groudonmcl.github.io/LK-Owlbear/";
const DEV_PORT = 5173;

/**
 * Owlbear manifest with absolute URLs, so it works however Owlbear resolves
 * paths for an extension hosted below the site root (GitHub Pages project sites).
 */
function manifest(siteUrl: string) {
  const at = (file: string) => new URL(file, siteUrl).href;
  return {
    name: "LegendKeeper Link",
    version: pkg.version,
    manifest_version: 1,
    author: "GroudonMcL",
    description: "Open a token's LegendKeeper page from its context menu.",
    homepage_url: "https://github.com/GroudonMcL/LK-Owlbear",
    icon: at("icon.svg"),
    background_url: at("background.html"),
    action: {
      title: "LegendKeeper Link",
      icon: at("icon.svg"),
      popover: at("index.html"),
      width: 320,
      height: 360,
    },
  };
}

function owlbearManifest(): Plugin {
  return {
    name: "owlbear-manifest",
    configureServer(server) {
      server.middlewares.use("/manifest.json", (_req, res) => {
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(manifest(`http://localhost:${DEV_PORT}/`), null, 2));
      });
    },
    generateBundle() {
      const siteUrl = process.env.SITE_URL ?? DEFAULT_SITE_URL;
      this.emitFile({
        type: "asset",
        fileName: "manifest.json",
        source: JSON.stringify(manifest(siteUrl.endsWith("/") ? siteUrl : `${siteUrl}/`), null, 2),
      });
    },
  };
}

export default defineConfig(({ command, isPreview }) => ({
  // Built and previewed under the site's path (e.g. /LK-Owlbear/), as on GitHub Pages.
  base: command === "build" || isPreview ? new URL(process.env.SITE_URL ?? DEFAULT_SITE_URL).pathname : "/",
  plugins: [react(), owlbearManifest()],
  server: { port: DEV_PORT, cors: true },
  build: {
    rollupOptions: {
      input: Object.fromEntries(PAGES.map((page) => [page, resolve(import.meta.dirname, `${page}.html`)])),
    },
  },
}));
