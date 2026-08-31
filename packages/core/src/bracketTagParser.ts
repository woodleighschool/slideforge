// Seqta's own bracket-tag syntax embedded in plain text, e.g.
// "[[image:photo.png|left|small]]What is a bank?"

import type { BracketTag, ContentRun } from "./types.js";

const TAG_PATTERN = /\[\[(image|resource|embed):(.*?)\]\]/g;

/**
 * Splits raw text into an ordered sequence of plain-text runs and bracket
 * tags, preserving position so callers can decide layout/ordering later.
 */
export function splitIntoRuns(raw: string): ContentRun[] {
  if (!raw) return [];

  const runs: ContentRun[] = [];
  let lastEnd = 0;
  TAG_PATTERN.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = TAG_PATTERN.exec(raw)) !== null) {
    const matchStart = match.index;
    const matchEnd = match.index + match[0].length;

    if (matchStart > lastEnd) {
      const textPart = raw.slice(lastEnd, matchStart);
      if (textPart) runs.push({ kind: "text", text: textPart });
    }

    const kind = match[1] ?? "";
    const body = match[2] ?? "";
    const tag = parseTag(kind, body);
    if (tag) runs.push({ kind: "tag", tag });

    lastEnd = matchEnd;
  }

  if (lastEnd < raw.length) {
    const trailing = raw.slice(lastEnd);
    if (trailing) runs.push({ kind: "text", text: trailing });
  }

  return runs;
}

/** True if this text contains nothing but bracket tags and whitespace. */
export function isPureTagContent(raw: string): boolean {
  return splitIntoRuns(raw).every((run) => {
    if (run.kind === "text") return run.text.trim().length === 0;
    return true;
  });
}

function parseTag(kind: string, body: string): BracketTag | null {
  // Fields are pipe-separated; trailing empty fields (e.g. "...|||]]") are
  // common in real Seqta exports and just mean "no more attributes."
  const parts = body.split("|");

  switch (kind) {
    case "image": {
      const filename = parts[0];
      if (!filename || filename.trim() === "") return null;
      const position = parts.length > 1 && parts[1] !== "" ? (parts[1] ?? null) : null;
      const size = parts.length > 2 && parts[2] !== "" ? (parts[2] ?? null) : null;
      const extras = parts.length > 3 ? parts.slice(3).filter((p) => p !== "") : [];
      return {
        type: "image",
        filename: filename.trim(),
        position,
        size,
        extras,
      };
    }
    case "resource": {
      const filename = parts[0];
      if (!filename || filename.trim() === "") return null;
      return { type: "resource", filename: filename.trim() };
    }
    case "embed": {
      const url = parts[0];
      if (!url || url.trim() === "") return null;
      const mode = parts.length > 1 && parts[1] !== "" ? (parts[1] ?? "full") : "full";
      return { type: "embed", url: url.trim(), mode };
    }
    default:
      return null;
  }
}
