const TEMPLATES_PARENT = "templates";

/**
 * Turns raw API resources into a page list (see src/lk/types.ts PageList).
 * A page counts as hidden when it or any folder above it is hidden.
 * Templates (under the API's `templates` parent) are left out: they are not pages to open.
 *
 * @param {{ id: string, name: string, isPublic: boolean }} project
 * @param {Array<{ id: string, name: string, parentId?: string | null, aliases?: string[], tags?: string[], isHidden?: boolean }>} resources
 * @param {"public" | "gm"} audience
 * @param {Date} [now]
 */
export function buildPageList(project, resources, audience, now = new Date()) {
  const byId = new Map(resources.map((r) => [r.id, r]));

  const ancestors = (resource) => {
    const chain = [];
    const seen = new Set([resource.id]);
    let parent = resource.parentId ? byId.get(resource.parentId) : undefined;
    while (parent && !seen.has(parent.id)) {
      chain.unshift(parent);
      seen.add(parent.id);
      parent = parent.parentId ? byId.get(parent.parentId) : undefined;
    }
    return chain;
  };

  const isTemplate = (resource, chain) =>
    (chain[0] ?? resource).parentId === TEMPLATES_PARENT;

  const pages = resources.flatMap((resource) => {
    const chain = ancestors(resource);
    if (isTemplate(resource, chain)) return [];
    return {
      id: resource.id,
      name: resource.name,
      aliases: resource.aliases ?? [],
      tags: resource.tags ?? [],
      path: chain.map((a) => a.name),
      hidden: Boolean(resource.isHidden) || chain.some((a) => a.isHidden),
    };
  });

  return {
    projectId: project.id,
    projectName: project.name,
    isPublic: project.isPublic,
    generatedAt: now.toISOString(),
    audience,
    pages,
  };
}
