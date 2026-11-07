// Pulls the exact file names out of Seqta's own "Resources" layout block,
// for when a teacher has saved the whole rendered lesson page rather than
// copying Seqta's bracket-tag lesson HTML — the usual case being a lesson
// whose Resources section doesn't copy across with full file names.
//
// This is deliberately a separate, resources-only path from the normal
// lesson-HTML -> slides pipeline (buildPipeline.ts): a saved page is the
// whole Seqta app shell (navigation, editor chrome, module palette, and
// so on), not lesson content, so none of it should ever reach
// parseLessonHTML/assembleSlides. All this does is find the Resources
// block and match its files — nothing here builds or touches a slide.
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

import type { BundledResource } from "./bundleResources.js";
import { matchResource } from "./resourceMatcher.js";
import type { ResourceMap } from "./types.js";

export function extractResourceCardFilenames(html: string): string[] {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const seen = new Set<string>();
  const names: string[] = [];

  for (const element of doc.querySelectorAll('[class*="ResourceModuleBody__name"]')) {
    const name = (element.textContent || "").trim();
    if (!name || seen.has(name)) continue;
    seen.add(name);
    names.push(name);
  }

  return names;
}

export interface SavedPageResourceMatches {
  matched: BundledResource[];
  unmatchedFilenames: string[];
}

/** Finds every Resources-block file in a saved lesson page and matches each
 * against the teacher's loaded resources. Nothing here is a guess — a name
 * either matches a file in the folder/ZIP or it doesn't. */
export function matchSavedPageResources(
  html: string,
  resources: ResourceMap,
): SavedPageResourceMatches {
  const matched: BundledResource[] = [];
  const unmatchedFilenames: string[] = [];

  for (const filename of extractResourceCardFilenames(html)) {
    const entry = matchResource(filename, resources);
    if (entry) matched.push({ filename, dataUrl: entry.dataUrl });
    else unmatchedFilenames.push(filename);
  }

  return { matched, unmatchedFilenames };
}
