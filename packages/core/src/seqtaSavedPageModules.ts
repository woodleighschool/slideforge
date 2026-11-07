// Walks a saved Seqta lesson page (File > Save Page As... > Webpage, HTML
// only) and turns its module tree into the same LessonBlock[] shape
// lessonHTMLParser.ts produces from pasted lesson HTML. This is now the only
// way lesson content reaches the app: Seqta's own copy-paste only carries
// across "Legacy editor" modules, dropping Title/Text/Resources content
// entirely, while the saved page has everything Seqta actually rendered.
//
// Seqta's lesson chrome (navigation, the editor's own toolbar, the module
// palette) sits outside a single wrapper — [class*="RootModule__root-module"]
// — that contains nothing but the lesson's own modules. Starting there means
// none of that chrome needs recognising or filtering by name.
//
// Within that wrapper, each top-level module is a
// [class*="Module__wrapper"] element. Two things inside a module are pure
// editor noise, present on every module regardless of type, and get
// stripped before reading any text: the small type badge
// ([data-testid="module-type-label"], e.g. "Title"/"Text"/"Resource(s)")
// and the inline rich-text toolbar ([class*="Toolbar__Toolbar"]).
//
// A module's own content class (matched by substring, since CSS-module
// hashes change between Seqta releases) says what it is:
// - [class*="TitleModuleBody"]: the lesson's visible heading -> slideTitle.
// - [class*="ResourceModuleBody"]: a Resources block -> one resourceCard per
//   [class*="ResourceModuleBody__name"] entry (same filenames
//   seqtaResourceCards.ts already reads off the same markup).
// - [class*="LegacyModuleBody"] (CKEditor/iframe content): the section's
//   actual content lives in a separate file Chrome saves alongside the main
//   page, in a "<page>_files" companion folder — never inline in the single
//   .html a teacher uploads. When that folder's contents are supplied too
//   (`companionFiles`), the module's own <iframe src="..."> names exactly
//   which file to read, and that file turns out to be plain CKEditor output
//   (headings/paragraphs/links, plus <img data-macro="Image"|"Resource">
//   for anything inserted — see lessonHTMLParser.ts), so it goes through the
//   very same parseLessonHTML() used for the generic fallback below. When
//   the companion folder wasn't supplied, or didn't include this particular
//   file, this becomes a single empty paragraph instead: a wordless
//   placeholder that holds the gap's position in reading order without
//   claiming to explain it.
// - Anything else (Math, layout/multi-column wrappers, and any module type
//   not seen yet) is "low usage" per the lesson's own structure: recurse
//   into any modules nested inside it (a layout module commonly wraps a
//   Title + Resources pair), and if it has none of its own, fall back to
//   parseLessonHTML on its cleaned contents so loose text and links still
//   come through.
//
// "Essential Learning" and "Homework" sections are a separate Seqta concept
// from the lesson page itself (not modules inside RootModule__root-module),
// so they are already outside everything this file looks at.

import { extractResourceCardFilenamesFromElement } from "./seqtaResourceCards.js";
import { parseLessonHTML } from "./lessonHTMLParser.js";
import type { LessonBlock } from "./types.js";

const ROOT_SELECTOR = '[class*="RootModule__root-module"]';
const MODULE_WRAPPER_SELECTOR = '[class*="Module__wrapper"]';
const MODULE_TYPE_LABEL_SELECTOR = '[data-testid="module-type-label"]';
const TOOLBAR_SELECTOR = '[class*="Toolbar__Toolbar"]';
const MODULE_BODY_SELECTOR = '[class*="ModuleBody"]';

/** A saved page's companion "<page>_files" folder, as filename -> that
 * file's text content. Only the small saved_resource*.html files inside it
 * matter here — the folder also holds megabytes of Seqta's own JS/CSS the
 * caller should never need to read, let alone hand to this function. */
export type CompanionFileMap = ReadonlyMap<string, string>;

export function extractLessonBlocksFromSavedPage(
  html: string,
  companionFiles?: CompanionFileMap,
): LessonBlock[] {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const root = doc.querySelector(ROOT_SELECTOR);
  if (!root) return [];

  return directChildModules(root).flatMap((wrapper) => blocksForModule(wrapper, companionFiles));
}

/** Every [class*="Module__wrapper"] inside `container`, excluding ones
 * nested inside another such wrapper that is itself inside `container` —
 * i.e. only the modules that belong directly to this container, not their
 * descendants' own nested modules. */
function directChildModules(container: ParentNode & Node): Element[] {
  const all = Array.from(container.querySelectorAll(MODULE_WRAPPER_SELECTOR));
  return all.filter((el) => !hasModuleWrapperAncestorWithin(el, container));
}

function hasModuleWrapperAncestorWithin(element: Element, boundary: Node): boolean {
  let parent = element.parentElement;
  while (parent && parent !== boundary) {
    if (matchesClass(parent, "Module__wrapper")) return true;
    parent = parent.parentElement;
  }
  return false;
}

function matchesClass(element: Element, substring: string): boolean {
  return (element.getAttribute("class") || "").includes(substring);
}

/** Clones `element` and removes the type-badge and toolbar noise that's
 * present inside every module regardless of its type. */
function stripNoise(element: Element): Element {
  const clone = element.cloneNode(true) as Element;
  for (const el of Array.from(clone.querySelectorAll(MODULE_TYPE_LABEL_SELECTOR))) {
    el.remove();
  }
  for (const el of Array.from(clone.querySelectorAll(TOOLBAR_SELECTOR))) {
    el.remove();
  }
  return clone;
}

function blocksForModule(wrapper: Element, companionFiles?: CompanionFileMap): LessonBlock[] {
  const bodyClass = ownModuleBodyClass(wrapper);

  if (bodyClass.includes("TitleModuleBody")) return titleBlocks(wrapper);
  if (bodyClass.includes("ResourceModuleBody")) return resourceBlocks(wrapper);
  if (bodyClass.includes("LegacyModuleBody")) return legacyBlocks(wrapper, companionFiles);

  const nested = directChildModules(wrapper);
  if (nested.length > 0) {
    return nested.flatMap((child) => blocksForModule(child, companionFiles));
  }

  return genericBlocks(wrapper);
}

/** The module-body class belonging to `wrapper` itself, not to a module
 * nested inside it. querySelector returns the first match in document
 * order, and a wrapper's own body markup always precedes any module nested
 * inside that body, so this naturally finds the wrapper's own class first. */
function ownModuleBodyClass(wrapper: Element): string {
  return wrapper.querySelector(MODULE_BODY_SELECTOR)?.getAttribute("class") || "";
}

function titleBlocks(wrapper: Element): LessonBlock[] {
  const text = normalizeText(stripNoise(wrapper).textContent || "");
  return text ? [{ type: "slideTitle", title: text }] : [];
}

function resourceBlocks(wrapper: Element): LessonBlock[] {
  const cleaned = stripNoise(wrapper);
  return extractResourceCardFilenamesFromElement(cleaned).map((filename) => ({
    type: "resourceCard",
    filename,
  }));
}

function legacyBlocks(wrapper: Element, companionFiles?: CompanionFileMap): LessonBlock[] {
  const companionHTML = companionFiles && findCompanionFile(wrapper, companionFiles);
  if (companionHTML) {
    const blocks = parseLessonHTML(companionHTML);
    if (blocks.length > 0) return blocks;
  }
  return legacyPlaceholderBlocks();
}

/** The module's own <iframe src="./<page>_files/saved_resource(N).html">
 * names exactly which companion file holds its real content — read the
 * basename off that src and look it up directly, rather than guessing at a
 * naming convention ourselves. */
function findCompanionFile(wrapper: Element, companionFiles: CompanionFileMap): string | undefined {
  const src = wrapper.querySelector("iframe")?.getAttribute("src");
  if (!src) return undefined;

  const basename = src.split("/").pop() || "";
  try {
    return companionFiles.get(decodeURIComponent(basename)) ?? companionFiles.get(basename);
  } catch {
    return companionFiles.get(basename);
  }
}

function legacyPlaceholderBlocks(): LessonBlock[] {
  // A single run with no text, rather than no runs at all — generatePptx.ts
  // flows one text shape per paragraph run, so an empty run still reserves
  // this section's line in the output instead of silently contributing
  // nothing to it.
  return [{ type: "paragraphText", runs: [{ kind: "plain", text: "" }] }];
}

function genericBlocks(wrapper: Element): LessonBlock[] {
  const cleaned = stripNoise(wrapper);
  return parseLessonHTML(cleaned.outerHTML);
}

function normalizeText(raw: string): string {
  return raw.replace(/ /g, " ").replace(/ /g, " ").replace(/\s+/g, " ").trim();
}
