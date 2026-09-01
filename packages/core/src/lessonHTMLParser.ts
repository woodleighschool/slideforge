// Parses raw Seqta lesson HTML into an ordered list of LessonBlocks. Grouping
// blocks into actual slides happens later, in slideAssembler.ts.
//
// Recursively walks every node in document order, not just direct children
// of <body> — Seqta/Word/OneNote exports routinely wrap the whole lesson in a
// chain of nested <div>s, sometimes several levels deep. Recognized block
// tags (heading/paragraph/list/table) are handled as leaves; everything else
// (div, span, font, strong, em, b, u, ...) is transparent — it contributes no
// block of its own, so parsing just keeps descending through it, carrying
// along the nearest enclosing <a href> so loose links outside a <p> still
// work. A <br> outside any recognized block is treated as a paragraph
// boundary, same as hitting a block tag.

import { splitIntoRuns } from "./bracketTagParser.js";
import type { BracketTag, LessonBlock, TextRun } from "./types.js";

export function parseLessonHTML(rawHTML: string): LessonBlock[] {
  // <o:p> is a stray Word/Outlook artifact that sometimes survives a paste
  // into Seqta. It carries no content — safe to remove before parsing at all.
  const cleanedHTML = rawHTML.replace(/<\/?o:p>/gi, "");

  const doc = new DOMParser().parseFromString(cleanedHTML, "text/html");
  const body = doc.body;
  if (!body) return [];

  const blocks: LessonBlock[] = [];

  // Loose text/links that aren't inside a recognized block tag accumulate
  // here until the next block boundary (heading/paragraph/list/table/<br>),
  // then get flushed together through the same run-building path a real <p> uses.
  let pendingSegments: TextSegment[] = [];

  function flushPendingSegments() {
    if (pendingSegments.length === 0) return;
    blocks.push(...buildParagraphBlocks(pendingSegments));
    pendingSegments = [];
  }

  function walk(node: ChildNode, href: string | null) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;
      const tag = element.tagName.toLowerCase();
      switch (tag) {
        case "h1":
        case "h2":
        case "h3":
          flushPendingSegments();
          blocks.push(...parseHeading(element));
          break;
        case "p":
          flushPendingSegments();
          blocks.push(...parseParagraph(element));
          break;
        case "ul":
        case "ol":
          flushPendingSegments();
          blocks.push(...parseList(element));
          break;
        case "table": {
          flushPendingSegments();
          const tableBlock = parseTable(element);
          if (tableBlock) blocks.push(tableBlock);
          break;
        }
        case "br":
          // A manual line break used as a paragraph separator outside any
          // <p> — treat it as a boundary, same as hitting a block tag.
          flushPendingSegments();
          break;
        case "a": {
          const candidate = element.getAttribute("href") || "";
          const linkHref = candidate ? candidate : href;
          for (const child of Array.from(element.childNodes)) {
            walk(child, linkHref);
          }
          break;
        }
        default:
          // Transparent wrapper (div, span, font, strong, em, b, u, ...) —
          // not content itself, so just look inside it.
          for (const child of Array.from(element.childNodes)) {
            walk(child, href);
          }
      }
    } else if (node.nodeType === Node.TEXT_NODE) {
      const raw = node.textContent || "";
      if (raw) pendingSegments.push({ text: raw, url: href });
    }
  }

  for (const node of Array.from(body.childNodes)) {
    walk(node, null);
  }
  flushPendingSegments();

  return blocks;
}

// --- Element handlers ---

interface TextSegment {
  text: string;
  url: string | null;
}

function parseHeading(element: Element): LessonBlock[] {
  const runs = splitIntoRuns(element.textContent || "");
  const title = runs
    .filter((r) => r.kind === "text")
    .map((r) => cleanText(r.text))
    .join(" ")
    .trim();

  const result: LessonBlock[] = [];
  // Skip empty heading tags (Seqta sometimes leaves blank spacers, e.g. <h3><br></h3>).
  if (title) result.push({ type: "slideTitle", title });
  result.push(...tagBlocks(runs));
  return result;
}

function parseParagraph(element: Element): LessonBlock[] {
  return buildParagraphBlocks(extractTextSegments(element));
}

/** Walks an element's descendants in document order, pairing each text node
 * with the URL of the nearest enclosing `<a href="...">` (null if none). */
function extractTextSegments(element: Element): TextSegment[] {
  const segments: TextSegment[] = [];

  function walk(node: ChildNode, href: string | null) {
    if (node.nodeType === Node.TEXT_NODE) {
      const raw = node.textContent || "";
      if (raw) segments.push({ text: raw, url: href });
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      let childHref = href;
      if (el.tagName.toLowerCase() === "a") {
        const candidate = el.getAttribute("href");
        if (candidate) childHref = candidate;
      }
      for (const child of Array.from(el.childNodes)) {
        walk(child, childHref);
      }
    }
  }

  for (const child of Array.from(element.childNodes)) {
    walk(child, null);
  }
  return segments;
}

/** Turns (text, url) segments into blocks. Bracket tags ([[image:...]] etc.)
 * still split out as their own dedicated blocks. Everything else accumulates
 * into a single paragraphText block of plain/link runs. */
function buildParagraphBlocks(segments: TextSegment[]): LessonBlock[] {
  const result: LessonBlock[] = [];
  let pending: TextRun[] = [];

  function flushPending() {
    if (pending.length === 0) return;
    // trimEdges can reduce a run list down to nothing — e.g. a stray
    // &nbsp;/whitespace text node between sibling tags in pasted HTML.
    // Without this check that produced an empty paragraphText block —
    // invisible, but still charged a layout slot in generatePptx.ts.
    const trimmed = trimEdges(pending);
    if (trimmed.length > 0) result.push({ type: "paragraphText", runs: trimmed });
    pending = [];
  }

  for (const segment of segments) {
    const runs = splitIntoRuns(segment.text);
    for (const run of runs) {
      if (run.kind === "text") {
        const normalized = normalizeWhitespace(run.text);
        if (!normalized) continue;
        if (segment.url) {
          pending.push({ kind: "link", text: normalized, url: segment.url });
        } else {
          pending.push({ kind: "plain", text: normalized });
        }
      } else {
        flushPending();
        const block = lessonBlockForTag(run.tag);
        if (block) result.push(block);
      }
    }
  }
  flushPending();
  return result;
}

/** Trims leading whitespace off the first run and trailing whitespace off the
 * last one only — interior runs are left alone — then drops any run left
 * empty by that trim. */
function trimEdges(runs: TextRun[]): TextRun[] {
  if (runs.length === 0) return runs;
  const result = runs.slice();
  const lastIndex = result.length - 1;
  const first = result[0];
  const last = result[lastIndex];

  if (result.length === 1 && first) {
    result[0] = mapRunText(first, (t) => t.trim());
  } else if (first && last) {
    result[0] = mapRunText(first, (t) => t.replace(/^\s+/, ""));
    result[lastIndex] = mapRunText(last, (t) => t.replace(/\s+$/, ""));
  }
  return result.filter((r) => r.text.length > 0);
}

function mapRunText(run: TextRun, transform: (text: string) => string): TextRun {
  return { ...run, text: transform(run.text) };
}

/** Collapses nbsp variants and any run of whitespace into a single plain
 * space, WITHOUT trimming the edges — that happens once, later, across the
 * whole assembled paragraph (see trimEdges). */
function normalizeWhitespace(raw: string): string {
  const nbspNormalized = raw.replace(/\u00A0/g, " ").replace(/\u202F/g, " ");
  return nbspNormalized.replace(/[ \t\n\r]+/g, " ");
}

function parseList(element: Element): LessonBlock[] {
  const items = Array.from(element.querySelectorAll("li"));
  const listText: string[] = [];
  const tagBlocksFound: LessonBlock[] = [];

  for (const item of items) {
    const runs = splitIntoRuns(item.textContent || "");
    const itemText = runs
      .filter((r) => r.kind === "text")
      .map((r) => cleanText(r.text))
      .join(" ")
      .trim();

    if (itemText) listText.push(itemText);
    tagBlocksFound.push(...tagBlocks(runs));
  }

  const result: LessonBlock[] = [];
  if (listText.length > 0) result.push({ type: "bulletList", items: listText });
  result.push(...tagBlocksFound);
  return result;
}

function parseTable(element: Element): LessonBlock | null {
  const rows = Array.from(element.querySelectorAll("tr"));
  if (rows.length === 0) return null;

  const tableRows: string[][] = [];
  for (const row of rows) {
    const cells = Array.from(row.querySelectorAll("th, td"));
    const cellTexts = cells.map((c) => cleanText(c.textContent || ""));
    if (cellTexts.length > 0) tableRows.push(cellTexts);
  }

  if (tableRows.length === 0) return null;
  return { type: "table", rows: tableRows };
}

// --- Shared helpers ---

function tagBlocks(runs: ReturnType<typeof splitIntoRuns>): LessonBlock[] {
  const result: LessonBlock[] = [];
  for (const r of runs) {
    if (r.kind !== "tag") continue;
    const block = lessonBlockForTag(r.tag);
    if (block) result.push(block);
  }
  return result;
}

function lessonBlockForTag(tag: BracketTag): LessonBlock | null {
  switch (tag.type) {
    case "image":
      return {
        type: "image",
        filename: tag.filename,
        position: tag.position,
        size: tag.size,
        extras: tag.extras,
      };
    case "resource":
      return { type: "resourceCard", filename: tag.filename };
    case "embed":
      return { type: "videoEmbed", url: tag.url, mode: tag.mode };
    default:
      return null;
  }
}

/** Normalizes non-breaking space variants to a plain space, and trims outer
 * whitespace — without reordering or rewording anything. */
function cleanText(raw: string): string {
  return raw
    .replace(/\u00A0/g, " ")
    .replace(/\u202F/g, " ")
    .trim();
}
