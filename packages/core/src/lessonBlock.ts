import type { BlockMeta, LessonBlock } from "./types.js";

export function blockMeta(block: LessonBlock): BlockMeta {
  switch (block.type) {
    case "slideTitle":
      return { label: "New slide", summary: block.title };
    case "paragraphText": {
      const text = block.runs.map((run) => run.text).join("");
      // The only way a paragraphText block ends up with no runs at all is
      // the wordless placeholder seqtaSavedPageModules.ts emits for a
      // Legacy editor section — call that out here, in this diagnostic
      // list, even though the generated slide itself stays wordless.
      return {
        label: "Paragraph",
        summary: text || "(Legacy editor section — content not available from a saved page)",
      };
    }
    case "bulletList":
      return { label: "Bullet list", summary: block.items.join(" · ") };
    case "table":
      return {
        label: "Table",
        summary: `${block.rows.length} row${block.rows.length === 1 ? "" : "s"}`,
      };
    case "image": {
      const attributes = [block.position, block.size].filter(Boolean).join(", ");
      return {
        label: "Image",
        summary: attributes ? `${block.filename} (${attributes})` : block.filename,
      };
    }
    case "resourceCard":
      return { label: "Resource", summary: block.filename };
    case "videoEmbed":
      return { label: "Video", summary: `${block.url} (${block.mode})` };
  }
}
