// One piece of parsed lesson content, in document order. A "new slide"
// boundary is just a slideTitle block; grouping these into actual slides
// happens later, in slideAssembler.ts.

import type { BlockMeta, LessonBlock, TextRun } from "./types.js";

function runText(run: TextRun): string {
  return run.text;
}

/** Short human-readable label + icon name, for a parsed-content preview UI. */
export function blockMeta(block: LessonBlock): BlockMeta {
  switch (block.type) {
    case "slideTitle":
      return { icon: "layers-plus", label: "New Slide", summary: block.title };
    case "paragraphText":
      return {
        icon: "align-left",
        label: "Paragraph",
        summary: block.runs.map(runText).join(""),
      };
    case "bulletList":
      return { icon: "list", label: "Bullet List", summary: block.items.join(" · ") };
    case "table":
      return {
        icon: "table",
        label: "Table",
        summary: `${block.rows.length} row${block.rows.length === 1 ? "" : "s"}`,
      };
    case "image": {
      const attrs = [block.position, block.size].filter(Boolean).join(", ");
      return {
        icon: "image",
        label: "Image",
        summary: attrs ? `${block.filename} (${attrs})` : block.filename,
      };
    }
    case "resourceCard":
      return { icon: "paperclip", label: "Resource", summary: block.filename };
    case "videoEmbed":
      return { icon: "play", label: "Video", summary: `${block.url} (${block.mode})` };
    default:
      return { icon: "help-circle", label: "Unknown", summary: "" };
  }
}

export { runText };
