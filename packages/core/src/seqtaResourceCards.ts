// Pulls the exact file names out of Seqta's own "Resources" module, as
// rendered in a saved lesson page (seqtaSavedPageModules.ts) — the only way
// Resources content reaches the app, since Seqta's copy-paste never carries
// file names across at all.
//
// Seqta renders each resource as a card: an <a> wrapping an icon and a
// <div class="ResourceModuleBody__name___xxxxx">filename.ext</div>. The
// screen often shows that name visually truncated with "…", but the full
// name is already sitting in the page's own markup underneath it — no
// OCR, no AI, no guessing, just reading text that's already there.
//
// CSS-module class names carry a build-specific hash suffix that can
// change between Seqta releases, so we match on the stable
// "ResourceModuleBody__name" prefix rather than the exact class. The name
// text ends up duplicated onto both the outer <a> and the inner <div>
// (Seqta applies the same generated class to both), so results are
// deduped by filename.

/** Shared by both the string-based extractor below and
 * seqtaSavedPageModules.ts, which already has a parsed Element to hand and
 * shouldn't need to serialize it back to a string just to re-parse it. */
export function extractResourceCardFilenamesFromElement(root: ParentNode): string[] {
  const seen = new Set<string>();
  const names: string[] = [];

  for (const element of root.querySelectorAll('[class*="ResourceModuleBody__name"]')) {
    const name = (element.textContent || "").trim();
    if (!name || seen.has(name)) continue;
    seen.add(name);
    names.push(name);
  }

  return names;
}

export function extractResourceCardFilenames(html: string): string[] {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return extractResourceCardFilenamesFromElement(doc);
}
