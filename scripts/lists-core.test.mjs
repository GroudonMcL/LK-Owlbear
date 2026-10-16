import { describe, expect, it } from "vitest";
import { buildPageList } from "./lists-core.mjs";

const project = { id: "proj", name: "Test", isPublic: true };
const now = new Date("2026-01-01T00:00:00Z");

describe("buildPageList", () => {
  const resources = [
    { id: "world", name: "World", parentId: null, isHidden: false },
    { id: "npcs", name: "NPCs", parentId: "world", isHidden: true },
    { id: "bob", name: "Bob", parentId: "npcs", aliases: ["Robert"], tags: ["NPC"], isHidden: false },
    { id: "tpl", name: "NPC Template", parentId: "templates", isHidden: false },
    { id: "tplchild", name: "Template part", parentId: "tpl", isHidden: false },
  ];

  const list = buildPageList(project, resources, "gm", now);

  it("records the project and when the list was built", () => {
    expect(list).toMatchObject({
      projectId: "proj",
      projectName: "Test",
      isPublic: true,
      audience: "gm",
      generatedAt: "2026-01-01T00:00:00.000Z",
    });
  });

  it("builds the folder path, outermost first", () => {
    expect(list.pages.find((p) => p.id === "bob")).toEqual({
      id: "bob",
      name: "Bob",
      aliases: ["Robert"],
      tags: ["NPC"],
      path: ["World", "NPCs"],
      hidden: true,
    });
  });

  it("marks pages under a hidden folder as hidden", () => {
    expect(list.pages.find((p) => p.id === "world")?.hidden).toBe(false);
    expect(list.pages.find((p) => p.id === "npcs")?.hidden).toBe(true);
  });

  it("leaves templates out", () => {
    expect(list.pages.map((p) => p.id)).toEqual(["world", "npcs", "bob"]);
  });

  it("survives a parent cycle", () => {
    const cyclic = [
      { id: "a", name: "A", parentId: "b" },
      { id: "b", name: "B", parentId: "a" },
    ];
    expect(buildPageList(project, cyclic, "public", now).pages.map((p) => p.path)).toEqual([["B"], ["A"]]);
  });
});
