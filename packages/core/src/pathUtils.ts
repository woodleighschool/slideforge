// Shared path helpers used by both resource-import paths (zip and raw
// folder). Both need to detect and strip a single shared top-level wrapper
// folder — e.g. an export that wraps every file in "Resources/" or a
// randomly-named top folder — so resources land at the top level either way.

/** If every path shares one common first path component, treat it as a
 * wrapper folder and strip it so files land directly at the top level. */
export function detectWrapperFolder(paths: string[]): string | null {
  if (paths.length === 0) return null;
  const firstTop = paths[0]?.split("/")[0];
  if (!firstTop) return null;
  const allShareTop = paths.every((p) => p.split("/")[0] === firstTop);
  return allShareTop ? firstTop : null;
}

export function stripWrapper(path: string, wrapperPrefix: string | null): string {
  if (!wrapperPrefix) return path;
  const prefix = wrapperPrefix + "/";
  if (!path.startsWith(prefix)) return path;
  return path.slice(prefix.length);
}
