// Fetches the LegendKeeper page lists the extension searches, and writes
// <outDir>/public.json (keyless: what an anonymous visitor sees) and
// <outDir>/gm.json (with LK_API_KEY: hidden pages included).
//
// Usage: LK_API_KEY=lk_... node scripts/build-lists.mjs [outDir]
// Without LK_API_KEY, set LK_PROJECT_ID to build public.json only.
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { buildPageList } from "./lists-core.mjs";

const API = "https://www.legendkeeper.com/api/v3";
const outDir = process.argv[2] ?? "public/lk";
const key = process.env.LK_API_KEY?.trim();

async function get(path, { auth }) {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(`${API}${path}`, {
      headers: auth ? { Authorization: `Bearer ${key}` } : {},
    });
    if (res.ok) return res.json();
    if ((res.status === 429 || res.status >= 500) && attempt < 5) {
      const wait = Number(res.headers.get("retry-after")) || 2 ** attempt;
      await new Promise((r) => setTimeout(r, wait * 1000));
      continue;
    }
    const body = await res.text();
    throw new Error(`GET ${path} answered ${res.status}: ${body.slice(0, 300)}`);
  }
}

async function listResources(projectId, { auth }) {
  const resources = [];
  let cursor = "";
  do {
    const query = new URLSearchParams({ limit: "100" });
    if (cursor) query.set("cursor", cursor);
    const page = await get(`/projects/${projectId}/resources/?${query}`, { auth });
    resources.push(...page.data);
    cursor = page.nextCursor ?? "";
  } while (cursor);
  return resources;
}

async function write(name, list) {
  await mkdir(outDir, { recursive: true });
  await writeFile(join(outDir, name), JSON.stringify(list));
  const hidden = list.pages.filter((p) => p.hidden).length;
  console.log(`${name}: ${list.pages.length} pages (${hidden} hidden) from "${list.projectName}"`);
}

async function main() {
  let project;
  if (key) {
    // A key belongs to exactly one project.
    const projects = await get("/projects/", { auth: true });
    project = projects.data[0];
    if (!project) throw new Error("LK_API_KEY can see no project.");
  } else if (process.env.LK_PROJECT_ID) {
    project = { id: process.env.LK_PROJECT_ID, name: process.env.LK_PROJECT_ID, isPublic: true };
  } else {
    throw new Error("Set LK_API_KEY (repository secret) or LK_PROJECT_ID.");
  }

  const publicResources = project.isPublic
    ? await listResources(project.id, { auth: false })
    : [];
  await write("public.json", buildPageList(project, publicResources, "public"));

  if (key) {
    const gmResources = await listResources(project.id, { auth: true });
    await write("gm.json", buildPageList(project, gmResources, "gm"));
  } else {
    console.log("gm.json: skipped (no LK_API_KEY); the GM will search public.json.");
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
